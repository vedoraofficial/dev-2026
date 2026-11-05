import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BankVerificationResult,
  VerifyBankParams,
} from './bank-verification.interface';
import { calculateNameMatch } from './name-matcher.util';

// RBI Standard IFSC Code Regex: 4 letters, '0', 6 alphanumeric characters
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// Standard Account Number: 5 to 35 alphanumeric characters (no spaces or special chars)
const ACCOUNT_NUMBER_REGEX = /^[a-zA-Z0-9]{5,35}$/;

@Injectable()
export class RazorpayBankVerificationService {
  private readonly logger = new Logger(RazorpayBankVerificationService.name);

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
   * Check if Razorpay credentials are configured
   */
  isConfigured(): boolean {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    return Boolean(keyId && keySecret);
  }

  /**
   * Perform Penny Drop Bank Account Verification via RazorpayX
   * Validates account with RBI/bank network, checks IFSC, and verifies account holder name.
   */
  async verifyBankAccount(params: VerifyBankParams): Promise<BankVerificationResult> {
    const accountNumber = params.accountNumber.trim().replace(/[^a-zA-Z0-9]/g, '');
    const ifscCode = params.ifscCode.trim().toUpperCase();
    const accountHolderName = params.accountHolderName.trim();
    const userName = (params.userName || accountHolderName).trim();
    const phone = params.phone ? params.phone.trim() : '9999999999';

    this.logger.log(
      `[RazorpayX Penny Drop] Validating A/C: ****${accountNumber.slice(-4)} (${ifscCode}) for "${accountHolderName}"`,
    );

    // 1. Pre-validation: IFSC format check
    if (!this.validateIfsc(ifscCode)) {
      return {
        isValid: false,
        accountStatus: 'INVALID',
        accountStatusCode: 'INVALID_IFSC',
        nameMatchScore: 0,
        nameMatchResult: 'NO_MATCH',
        failureReason: `Invalid IFSC code format: "${ifscCode}". Must be 11 characters (e.g. SBIN0000284).`,
      };
    }

    // 2. Pre-validation: Account number format check
    if (!this.validateAccountNumber(accountNumber)) {
      return {
        isValid: false,
        accountStatus: 'INVALID',
        accountStatusCode: 'INVALID_ACCOUNT_NUMBER',
        nameMatchScore: 0,
        nameMatchResult: 'NO_MATCH',
        failureReason: 'Invalid bank account number. Must contain 5 to 35 alphanumeric characters.',
      };
    }

    // 3. Check credentials
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    let sourceAccount = this.configService.get<string>('RAZORPAY_ACCOUNT_NUMBER');
    const env = (this.configService.get<string>('RAZORPAY_ENV') || 'TEST').toUpperCase();

    if (!this.isConfigured() || !sourceAccount) {
      if (process.env.NODE_ENV === 'production' || env === 'LIVE') {
        this.logger.error('[RazorpayX Penny Drop] Credentials not configured in production/LIVE environment.');
        return {
          isValid: false,
          accountStatus: 'INVALID',
          accountStatusCode: 'CONFIG_ERROR',
          nameMatchScore: 0,
          nameMatchResult: 'NO_MATCH',
          failureReason: 'Bank verification service is not configured in production.',
        };
      }
      this.logger.warn('[RazorpayX Penny Drop] Credentials not fully configured. Running simulation mode.');
      return this.runSimulation(accountNumber, ifscCode, accountHolderName, userName);
    }

    // Sanitize source account number
    sourceAccount = sourceAccount.trim().replace(/[^a-zA-Z0-9]/g, '');

    // 4. Call RazorpayX Fund Account Validation API
    try {
      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const payload = {
        account_number: sourceAccount,
        fund_account: {
          account_type: 'bank_account',
          bank_account: {
            name: accountHolderName,
            ifsc: ifscCode,
            account_number: accountNumber,
          },
          contact: {
            name: accountHolderName,
            email: 'partner@vedoraofficial.com',
            contact: phone.length >= 10 ? phone.slice(-10) : '9999999999',
            type: 'vendor',
          },
        },
        amount: 100, // ₹1.00 penny drop (100 paise)
        currency: 'INR',
        notes: {
          purpose: 'Penny Drop Bank Verification',
          platform: 'Vedora',
        },
      };

      const response = await fetch('https://api.razorpay.com/v1/fund_accounts/validations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: authHeader,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorDesc =
          data?.error?.description ||
          data?.error?.reason ||
          data?.message ||
          'Bank verification rejected by RazorpayX';
        this.logger.warn(`[RazorpayX Penny Drop Rejected] ${errorDesc}: ${JSON.stringify(data)}`);

        return {
          isValid: false,
          accountStatus: 'INVALID',
          accountStatusCode: data?.error?.code || 'VALIDATION_REJECTED',
          nameMatchScore: 0,
          nameMatchResult: 'NO_MATCH',
          failureReason: errorDesc,
          rawResponse: data,
        };
      }

      // If Razorpay accepted or responded:
      const validationId = data.id;
      const status = data.status; // 'created' | 'completed' | 'failed'

      this.logger.log(
        `[RazorpayX Penny Drop Response] Validation ID: ${validationId}, Status: ${status}`,
      );

      // 1. Direct failure from RazorpayX
      if (status === 'failed') {
        const failureReason =
          data?.results?.failure_reason ||
          data?.error?.description ||
          'Bank account validation failed by beneficiary bank or RazorpayX.';
        return {
          isValid: false,
          accountStatus: 'INVALID',
          accountStatusCode: 'VALIDATION_FAILED',
          nameMatchScore: 0,
          nameMatchResult: 'NO_MATCH',
          failureReason,
          referenceId: validationId,
          rawResponse: data,
        };
      }

      // 2. In Live mode with immediate completed status
      if (status === 'completed' && data.results) {
        return this.processCompletedResults(data, accountHolderName, userName);
      }

      // 3. In Live mode, poll up to 4 times for completed or failed status
      if (status === 'created' && env === 'LIVE') {
        const pollResult = await this.pollValidationStatus(validationId, authHeader);
        if (pollResult) {
          if (pollResult.status === 'completed' && pollResult.results) {
            return this.processCompletedResults(pollResult, accountHolderName, userName);
          }
          if (pollResult.status === 'failed') {
            const failureReason =
              pollResult?.results?.failure_reason ||
              pollResult?.error?.description ||
              'Bank account validation failed by beneficiary bank.';
            return {
              isValid: false,
              accountStatus: 'INVALID',
              accountStatusCode: 'VALIDATION_FAILED',
              nameMatchScore: 0,
              nameMatchResult: 'NO_MATCH',
              failureReason,
              referenceId: validationId,
              rawResponse: pollResult,
            };
          }
        }

        // Live mode safety: if still pending after polling, return PENDING status; DO NOT fall through to sandbox
        this.logger.warn(`[RazorpayX Penny Drop] Live validation ${validationId} is pending after polling.`);
        return {
          isValid: false,
          accountStatus: 'PENDING',
          accountStatusCode: 'VERIFICATION_PENDING',
          nameMatchScore: 0,
          nameMatchResult: 'NO_MATCH',
          failureReason: 'Bank account validation is pending with the beneficiary bank. Please retry verification in a moment.',
          referenceId: validationId,
          rawResponse: data,
        };
      }

      // 4. In Test mode: run sandbox evaluation
      this.logger.log(
        `[RazorpayX Penny Drop Sandbox] Running sandbox evaluation for Ref: ${validationId}`,
      );

      return this.evaluateSandboxValidation(
        accountNumber,
        ifscCode,
        accountHolderName,
        userName,
        validationId,
        data,
      );
    } catch (err: any) {
      this.logger.error('[RazorpayX Penny Drop Network Error]', err);

      if (env === 'TEST' && process.env.NODE_ENV !== 'production') {
        return this.runSimulation(accountNumber, ifscCode, accountHolderName, userName);
      }

      return {
        isValid: false,
        accountStatus: 'UNKNOWN',
        accountStatusCode: 'NETWORK_ERROR',
        nameMatchScore: 0,
        nameMatchResult: 'NO_MATCH',
        failureReason: `Penny drop service network error: ${err.message}`,
      };
    }
  }

  /**
   * Process results when validation status is completed (Live Mode)
   */
  private processCompletedResults(
    data: any,
    accountHolderName: string,
    userName: string,
  ): BankVerificationResult {
    const results = data.results || {};
    const accountStatus = (results.account_status || '').toLowerCase();
    const registeredName = results.registered_name || null;
    const utr = data.utr || data.id;

    if (accountStatus !== 'active' && accountStatus !== 'valid') {
      return {
        isValid: false,
        accountStatus: 'INVALID',
        accountStatusCode: accountStatus.toUpperCase() || 'INACTIVE_ACCOUNT',
        nameMatchScore: 0,
        nameMatchResult: 'NO_MATCH',
        failureReason: `Bank account is ${accountStatus || 'inactive'} according to bank records.`,
        rawResponse: data,
      };
    }

    // Name match verification: Registered name from bank MUST match user identity
    if (!registeredName) {
      return {
        isValid: false,
        accountStatus: 'INVALID',
        accountStatusCode: 'NAME_NOT_RETURNED',
        nameMatchScore: 0,
        nameMatchResult: 'NO_MATCH',
        failureReason: 'Beneficiary bank did not return the registered account holder name for validation.',
        rawResponse: data,
      };
    }

    // Match bank registered name against both input name and user profile name
    const inputMatch = calculateNameMatch(accountHolderName, registeredName);
    const profileMatch = userName ? calculateNameMatch(userName, registeredName) : inputMatch;

    // Use conservative score
    const finalScore = Math.min(inputMatch.score, profileMatch.score);
    const finalResult = inputMatch.score <= profileMatch.score ? inputMatch.result : profileMatch.result;

    if (finalScore < 60 || finalResult === 'NO_MATCH') {
      return {
        isValid: false,
        accountStatus: 'INVALID',
        accountStatusCode: 'NAME_MISMATCH',
        registeredName,
        nameMatchScore: finalScore,
        nameMatchResult: finalResult,
        failureReason: `Account holder name does not match bank records. Registered name at bank: "${registeredName}" (Match: ${finalScore}%).`,
        rawResponse: data,
      };
    }

    return {
      isValid: true,
      accountStatus: 'VALID',
      accountStatusCode: 'ACCOUNT_IS_VALID',
      registeredName,
      nameMatchScore: finalScore,
      nameMatchResult: finalResult,
      utr,
      referenceId: data.id,
      rawResponse: data,
    };
  }

  /**
   * Poll status in live mode
   */
  private async pollValidationStatus(validationId: string, authHeader: string): Promise<any> {
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 1000));
      try {
        const res = await fetch(`https://api.razorpay.com/v1/fund_accounts/validations/${validationId}`, {
          headers: { Authorization: authHeader },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'completed' || data.status === 'failed') return data;
        }
      } catch {
        // ignore polling network error
      }
    }
    return null;
  }

  /**
   * Evaluate validation in Sandbox / Test Mode
   * Strictly isolated to non-production environments with realistic simulation rules.
   */
  private evaluateSandboxValidation(
    accountNumber: string,
    ifscCode: string,
    accountHolderName: string,
    userName: string,
    validationId: string,
    rawResponse?: any,
  ): BankVerificationResult {
    // Hard security check: Never run sandbox evaluation in production or LIVE environment
    const env = (this.configService.get<string>('RAZORPAY_ENV') || 'TEST').toUpperCase();
    if (process.env.NODE_ENV === 'production' || env === 'LIVE') {
      throw new Error('FATAL: Sandbox bank evaluation cannot be executed in production or LIVE environment.');
    }

    // 1. Account Number Sandbox Failure Patterns
    const isRepeatedDigits = /^(.)\1+$/.test(accountNumber);
    if (
      accountNumber.length < 9 ||
      accountNumber.endsWith('0000') ||
      accountNumber.endsWith('9999') ||
      accountNumber.endsWith('1111') ||
      accountNumber.endsWith('1234') ||
      isRepeatedDigits
    ) {
      this.logger.warn(`[RazorpayX Test Mode] Account ${accountNumber} simulated as INVALID_ACCOUNT`);
      return {
        isValid: false,
        accountStatus: 'INVALID',
        accountStatusCode: 'BENEFICIARY_BANK_REJECTED',
        nameMatchScore: 0,
        nameMatchResult: 'NO_MATCH',
        failureReason:
          'Bank account does not exist or has been rejected by beneficiary bank (Invalid Account Number).',
        referenceId: validationId,
        rawResponse,
      };
    }

    // Accounts ending in 8888 simulate bank downtime
    if (accountNumber.endsWith('8888')) {
      return {
        isValid: false,
        accountStatus: 'INVALID',
        accountStatusCode: 'BENEFICIARY_BANK_OFFLINE',
        nameMatchScore: 0,
        nameMatchResult: 'NO_MATCH',
        failureReason:
          'Beneficiary bank is currently offline or experiencing network downtime. Please try again later.',
        referenceId: validationId,
        rawResponse,
      };
    }

    // Accounts ending in 7777 simulate blocked/frozen account
    if (accountNumber.endsWith('7777')) {
      return {
        isValid: false,
        accountStatus: 'INVALID',
        accountStatusCode: 'ACCOUNT_BLOCKED',
        nameMatchScore: 0,
        nameMatchResult: 'NO_MATCH',
        failureReason: 'Bank account is frozen or blocked by the beneficiary bank.',
        referenceId: validationId,
        rawResponse,
      };
    }

    // 2. Name Matching Simulation
    // Accounts ending in 4444 simulate a different bank registered holder (Name Mismatch test)
    let simulatedBankName: string;
    if (accountNumber.endsWith('4444') || accountNumber.endsWith('5555')) {
      simulatedBankName = 'RAKESH SURESH JADHAV';
    } else {
      simulatedBankName = (userName || accountHolderName).trim().toUpperCase();
    }

    const match = calculateNameMatch(accountHolderName, simulatedBankName);

    this.logger.log(
      `[RazorpayX Test Mode] Name match check: Input "${accountHolderName}" vs Bank Registered "${simulatedBankName}" => Score: ${match.score} (${match.result})`,
    );

    // Fail if name match score < 60% or NO_MATCH
    if (match.score < 60 || match.result === 'NO_MATCH') {
      return {
        isValid: false,
        accountStatus: 'INVALID',
        accountStatusCode: 'NAME_MISMATCH',
        registeredName: simulatedBankName,
        nameMatchScore: match.score,
        nameMatchResult: match.result,
        failureReason: `Account holder name does not match bank records. Registered name at bank: "${simulatedBankName}" (${match.score}% match).`,
        referenceId: validationId,
        rawResponse,
      };
    }

    // 3. Success with dynamically calculated match score
    return {
      isValid: true,
      accountStatus: 'VALID',
      accountStatusCode: 'ACCOUNT_IS_VALID',
      registeredName: simulatedBankName,
      nameMatchScore: match.score,
      nameMatchResult: match.result,
      utr: rawResponse?.utr || `RZPX_TEST_${Date.now()}`,
      referenceId: validationId,
      rawResponse,
    };
  }

  /**
   * Offline simulation when API credentials are absent
   */
  private runSimulation(
    accountNumber: string,
    ifscCode: string,
    accountHolderName: string,
    userName: string,
  ): BankVerificationResult {
    return this.evaluateSandboxValidation(
      accountNumber,
      ifscCode,
      accountHolderName,
      userName,
      `fav_sim_${Date.now()}`,
    );
  }
}
