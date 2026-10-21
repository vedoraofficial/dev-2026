import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface RazorpayPayoutParams {
  withdrawalId: number;
  amountPaise: number;
  accountNumber: string;
  ifscCode: string;
  accountHolderName: string;
  phone?: string;
  email?: string;
}

export interface RazorpayPayoutResult {
  success: boolean;
  utr: string;
  referenceId: string;
  remarks: string;
  status?: string;
  rawResponse?: any;
}

@Injectable()
export class RazorpayPayoutService {
  private readonly logger = new Logger(RazorpayPayoutService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Check if Razorpay credentials are fully configured in .env
   */
  isConfigured(): boolean {
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    return Boolean(keyId && keySecret);
  }

  /**
   * Execute Payout to partner's bank account via RazorpayX
   */
  async executePayout(params: RazorpayPayoutParams): Promise<RazorpayPayoutResult> {
    const amountRupees = params.amountPaise / 100;
    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    const accountNumber = this.configService.get<string>('RAZORPAY_ACCOUNT_NUMBER');
    const env = (this.configService.get<string>('RAZORPAY_ENV') || 'TEST').toUpperCase();

    const idempotencyKey = `VED_WD_${params.withdrawalId}_${Date.now()}`;

    this.logger.log(
      `[RazorpayX Payout] Processing withdrawal #${params.withdrawalId} of ₹${amountRupees} to A/C: ****${params.accountNumber.slice(-4)} (${params.ifscCode}) [${env} mode]`,
    );

    // Live or Test API execution when credentials are provided
    if (this.isConfigured() && accountNumber) {
      // Validate that account number is not an Account ID (acc_...)
      if (accountNumber.startsWith('acc_')) {
        const err = `Invalid RAZORPAY_ACCOUNT_NUMBER in .env ('${accountNumber}'). You provided an Account/Merchant ID instead of your RazorpayX Banking Account Number. Please find your 10-18 digit account number in RazorpayX Dashboard under Banking+ -> Settings -> Banking or on the Banking Home card.`;
        this.logger.error(`[RazorpayX Payout Error] ${err}`);
        return {
          success: false,
          utr: '',
          referenceId: idempotencyKey,
          remarks: err,
        };
      }

      try {
        const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
        const cleanBeneficiaryAccount = params.accountNumber.trim().replace(/[^a-zA-Z0-9]/g, '');
        const cleanSourceAccount = accountNumber.trim().replace(/[^a-zA-Z0-9]/g, '');

        const payoutPayload = {
          account_number: cleanSourceAccount,
          fund_account: {
            account_type: 'bank_account',
            bank_account: {
              name: params.accountHolderName.trim(),
              ifsc: params.ifscCode.trim().toUpperCase(),
              account_number: cleanBeneficiaryAccount,
            },
            contact: {
              name: params.accountHolderName.trim(),
              email: params.email || 'partner@vedoraofficial.com',
              contact: params.phone || '9999999999',
              type: 'vendor',
              reference_id: `WD_${params.withdrawalId}`,
            },
          },
          amount: params.amountPaise,
          currency: 'INR',
          mode: 'IMPS',
          purpose: 'payout',
          queue_if_low_balance: true,
          reference_id: `VED_WD_${params.withdrawalId}`,
          narration: 'Vedora Partner Payout',
        };

        const response = await fetch('https://api.razorpay.com/v1/payouts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
            'X-Payout-Idempotency': idempotencyKey,
          },
          body: JSON.stringify(payoutPayload),
        });

        const data = await response.json();

        if (response.ok && data?.id) {
          const utr = data.utr || data.id;
          const status = data.status || 'processing';
          this.logger.log(
            `[RazorpayX Payout Success] Payout ID: ${data.id}, Status: ${status}, UTR: ${utr}`,
          );

          return {
            success: true,
            utr,
            referenceId: data.id,
            status,
            remarks: `RazorpayX Payout (${status}). UTR: ${utr}. Ref: ${data.id}`,
            rawResponse: data,
          };
        } else {
          const errorMsg =
            data?.error?.description ||
            data?.error?.reason ||
            data?.message ||
            'RazorpayX Payout API request failed';
          this.logger.warn(`[RazorpayX Payout Failed] ${errorMsg}: ${JSON.stringify(data)}`);

          return {
            success: false,
            utr: '',
            referenceId: idempotencyKey,
            remarks: `RazorpayX Payout error: ${errorMsg}`,
            rawResponse: data,
          };
        }
      } catch (error: any) {
        this.logger.error('[RazorpayX Payout Exception]', error);

        return {
          success: false,
          utr: '',
          referenceId: idempotencyKey,
          remarks: error.message || 'RazorpayX Payout network error',
        };
      }
    }

    // Default Test / Simulation Mode (when API keys are not yet configured or for sandbox testing)
    const testUtr = `RZPX_TEST_UTR_${Date.now().toString().slice(-10)}`;
    const testRef = `pout_test_${params.withdrawalId}_${Date.now()}`;
    this.logger.log(
      `[RazorpayX Test Mode] Simulated IMPS payout of ₹${amountRupees} to ${params.accountHolderName} (A/C: ****${params.accountNumber.slice(-4)}, IFSC: ${params.ifscCode}). UTR: ${testUtr}`,
    );

    return {
      success: true,
      utr: testUtr,
      referenceId: testRef,
      status: 'processed',
      remarks: `RazorpayX Test Payout (IMPS). UTR: ${testUtr}. Ref: ${testRef}`,
    };
  }

  /**
   * Fetch current payout status from RazorpayX
   */
  async getPayoutStatus(payoutId: string): Promise<any> {
    if (!this.isConfigured()) {
      return { id: payoutId, status: 'processed', utr: `RZPX_UTR_${Date.now().toString().slice(-10)}` };
    }

    const keyId = this.configService.get<string>('RAZORPAY_KEY_ID');
    const keySecret = this.configService.get<string>('RAZORPAY_KEY_SECRET');
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');

    const response = await fetch(`https://api.razorpay.com/v1/payouts/${payoutId}`, {
      method: 'GET',
      headers: {
        Authorization: authHeader,
      },
    });

    return response.json();
  }
}
