import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BankVerificationResult,
  VerifyBankParams,
} from './bank-verification.interface';
import { calculateNameMatch } from './name-matcher.util';

// RBI Standard IFSC Code Regex: 4 letters, '0', 6 alphanumeric characters
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// Standard Account Number: 9 to 18 digits
const ACCOUNT_NUMBER_REGEX = /^\d{9,18}$/;

@Injectable()
export class CashfreeVerificationService {
  private readonly logger = new Logger(CashfreeVerificationService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Validate Indian Financial System Code (IFSC) format
   */
  validateIfsc(ifsc: string): boolean {
    if (!ifsc) return false;
    return IFSC_REGEX.test(ifsc.trim().toUpperCase());
  }

  /**
   * Validate Account Number format
   */
  validateAccountNumber(accountNumber: string): boolean {
    if (!accountNumber) return false;
    return ACCOUNT_NUMBER_REGEX.test(accountNumber.trim());
  }

  /**
   * Check if Cashfree live/sandbox API credentials are configured
   */
  isConfigured(): boolean {
    const clientId = this.configService.get<string>('CASHFREE_CLIENT_ID');
    const clientSecret = this.configService.get<string>('CASHFREE_CLIENT_SECRET');
    return Boolean(clientId && clientSecret);
  }

  /**
   * Perform Penny Drop Bank Account Verification (Sync)
   * Transfers ₹1 to the destination account, fetches registered name from bank,
   * and verifies account validity and name match.
   */
  async verifyBankAccount(params: VerifyBankParams): Promise<BankVerificationResult> {
    const accountNumber = params.accountNumber.trim();
    const ifscCode = params.ifscCode.trim().toUpperCase();
    const accountHolderName = params.accountHolderName.trim();
    const userName = (params.userName || accountHolderName).trim();
    const phone = params.phone ? params.phone.trim() : undefined;

    // 1. Pre-validation checks
    if (!this.validateIfsc(ifscCode)) {
      return {
        isValid: false,
        accountStatus: 'INVALID',
        accountStatusCode: 'INVALID_IFSC',
        nameMatchScore: 0,
        nameMatchResult: 'NO_MATCH',
        failureReason: `Invalid IFSC code format: "${ifscCode}". Must be 11 characters (e.g. HDFC0001234).`,
      };
    }

    if (!this.validateAccountNumber(accountNumber)) {
      return {
        isValid: false,
        accountStatus: 'INVALID',
        accountStatusCode: 'INVALID_ACCOUNT_NUMBER',
        nameMatchScore: 0,
        nameMatchResult: 'NO_MATCH',
        failureReason: 'Invalid bank account number. Must contain 9 to 18 digits.',
      };
    }

    // 2. If credentials are NOT configured, run in Simulation/Sandbox mode
    if (!this.isConfigured()) {
      return this.runSimulation(accountNumber, ifscCode, accountHolderName, userName);
    }

    // 3. Call Cashfree Verification Suite API
    return this.callCashfreeApi(accountNumber, ifscCode, accountHolderName, userName, phone);
  }

  /**
   * Execute real HTTP request to Cashfree Verification Suite Sync Endpoint
   */
  private async callCashfreeApi(
    accountNumber: string,
    ifscCode: string,
    accountHolderName: string,
    userName: string,
    phone?: string,
  ): Promise<BankVerificationResult> {
    const clientId = this.configService.get<string>('CASHFREE_CLIENT_ID')!;
    const clientSecret = this.configService.get<string>('CASHFREE_CLIENT_SECRET')!;
    const env = (this.configService.get<string>('CASHFREE_ENV') || 'SANDBOX').toUpperCase();
    const threshold = Number(this.configService.get<number>('CASHFREE_NAME_MATCH_THRESHOLD')) || 60;

    const baseUrl =
      env === 'PRODUCTION'
        ? 'https://api.cashfree.com/verification'
        : 'https://sandbox.cashfree.com/verification';

    const url = `${baseUrl}/bank-account/sync`;

    this.logger.log(`Initiating Penny Drop verification with Cashfree (${env}) for IFSC: ${ifscCode}`);

    try {
      const payload: Record<string, any> = {
        bank_account: accountNumber,
        ifsc: ifscCode,
        name: accountHolderName,
      };
      if (phone) payload.phone = phone;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-client-id': clientId,
          'x-client-secret': clientSecret,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        this.logger.error(`Cashfree API Error [${response.status}]:`, data);
        return {
          isValid: false,
          accountStatus: 'INVALID',
          accountStatusCode: data.code || 'API_ERROR',
          nameMatchScore: 0,
          nameMatchResult: 'NO_MATCH',
          failureReason: data.message || `Cashfree verification failed with status ${response.status}`,
          rawResponse: data,
        };
      }

      const accountStatus = (data.account_status || '').toUpperCase();
      const registeredName = data.name_at_bank || data.registered_name || null;
      const utr = data.utr || null;
      const referenceId = String(data.reference_id || data.verification_id || '');

      // Check account validity
      if (accountStatus !== 'VALID') {
        return {
          isValid: false,
          accountStatus: 'INVALID',
          accountStatusCode: data.account_status_code || 'ACCOUNT_INVALID',
          registeredName,
          nameMatchScore: 0,
          nameMatchResult: 'NO_MATCH',
          referenceId,
          failureReason: data.message || 'Bank account does not exist or is inactive at destination bank.',
          rawResponse: data,
        };
      }

      // Compute or retrieve name match score
      let matchScore = 0;
      let matchResult = 'NO_MATCH';

      if (data.name_match_score !== undefined && data.name_match_score !== null) {
        matchScore = Number(data.name_match_score);
        matchResult = data.name_match_result || 'GOOD';
      } else if (registeredName) {
        // Compare with both entered accountHolderName and user profile name
        const match1 = calculateNameMatch(accountHolderName, registeredName);
        const match2 = calculateNameMatch(userName, registeredName);
        const best = match1.score >= match2.score ? match1 : match2;
        matchScore = best.score;
        matchResult = best.result;
      }

      // Check name match against required threshold
      if (matchScore < threshold) {
        this.logger.warn(
          `Penny drop name mismatch: Entered "${accountHolderName}", Bank registered "${registeredName}" (Score: ${matchScore}% < Threshold: ${threshold}%)`,
        );
        return {
          isValid: false,
          accountStatus: 'VALID',
          accountStatusCode: 'NAME_MISMATCH',
          registeredName,
          nameMatchScore: matchScore,
          nameMatchResult: matchResult as any,
          utr,
          referenceId,
          failureReason: `Name mismatch: Bank account belongs to "${registeredName}". Expected name matching "${accountHolderName}" (Score: ${matchScore}%).`,
          rawResponse: data,
        };
      }

      this.logger.log(
        `✅ Bank account verified successfully: UTR ${utr}, Registered Name: ${registeredName}, Score: ${matchScore}%`,
      );

      return {
        isValid: true,
        accountStatus: 'VALID',
        accountStatusCode: 'ACCOUNT_IS_VALID',
        registeredName,
        nameMatchScore: matchScore,
        nameMatchResult: matchResult as any,
        utr,
        referenceId,
        rawResponse: data,
      };
    } catch (error: any) {
      this.logger.error('Failed to communicate with Cashfree Verification API:', error);
      return {
        isValid: false,
        accountStatus: 'UNKNOWN',
        accountStatusCode: 'NETWORK_ERROR',
        nameMatchScore: 0,
        nameMatchResult: 'NO_MATCH',
        failureReason: error.message || 'Unable to connect to Cashfree verification service.',
      };
    }
  }

  /**
   * Simulation mode for local development and testing when API keys are not yet configured.
   */
  private runSimulation(
    accountNumber: string,
    ifscCode: string,
    accountHolderName: string,
    userName: string,
  ): BankVerificationResult {
    this.logger.log(
      `[SIMULATION] Performing simulated Penny Drop verification for ${accountHolderName} (${accountNumber}, ${ifscCode})`,
    );

    // Fail if dummy account number like all zeros
    if (accountNumber === '0000000000' || accountNumber === '9999999999' || accountNumber.startsWith('0000')) {
      return {
        isValid: false,
        accountStatus: 'INVALID',
        accountStatusCode: 'SIMULATED_INVALID_ACCOUNT',
        nameMatchScore: 0,
        nameMatchResult: 'NO_MATCH',
        failureReason: 'Simulated failure: Bank account does not exist or is inactive at destination bank.',
      };
    }

    const threshold = Number(this.configService.get<number>('CASHFREE_NAME_MATCH_THRESHOLD')) || 60;

    // Simulate registered name at bank (e.g. UPPERCASE of what user entered as account holder name)
    const registeredName = accountHolderName.trim().toUpperCase();

    // Check name match against user profile name
    const nameMatch = calculateNameMatch(userName, accountHolderName);

    const utr = `SIM_UTR_${Date.now().toString().slice(-10)}`;
    const referenceId = `CF_SIM_${Date.now()}`;

    // If score is below threshold, return failure
    if (nameMatch.score < threshold) {
      return {
        isValid: false,
        accountStatus: 'VALID',
        accountStatusCode: 'NAME_MISMATCH',
        registeredName,
        nameMatchScore: nameMatch.score,
        nameMatchResult: nameMatch.result,
        utr,
        referenceId,
        failureReason: `Name mismatch: Bank account belongs to "${registeredName}". Expected name matching "${userName}" (Score: ${nameMatch.score}% < Threshold: ${threshold}%).`,
      };
    }

    return {
      isValid: true,
      accountStatus: 'VALID',
      accountStatusCode: 'ACCOUNT_IS_VALID',
      registeredName,
      nameMatchScore: nameMatch.score,
      nameMatchResult: nameMatch.result,
      utr,
      referenceId,
    };
  }
}
