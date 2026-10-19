import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface SendOtpOptions {
  /** Recipient mobile number (10-digit or with country code) */
  mobile: string;
  /** The OTP code to send */
  otp: string;
  /** Country code without '+' (e.g., '91', '1'). Defaults to APITXT_DEFAULT_COUNTRY or '91' */
  country?: string;
  /** Delivery channel: 'sms' | 'whatsapp' | 'voice'. Defaults to env APITXT_CHANNEL or system default */
  channel?: 'sms' | 'whatsapp' | 'voice';
  /** Custom template ID registered on apitxt (e.g., 42). Defaults to env APITXT_TEMPLATE_ID */
  templateId?: string | number;
  /** Custom template name (e.g., 'verification_otp'). Defaults to env APITXT_TEMPLATE_NAME */
  templateName?: string;
  /** WhatsApp WABA project reference ID (e.g., 'PROJ_abc123def456'). Defaults to env APITXT_PROJECT_REF_ID */
  projectRefId?: string;
}

export interface SendOtpResult {
  success: boolean;
  message?: string;
  simulated?: boolean;
  rawResponse?: any;
}

@Injectable()
export class OtpSenderService {
  private readonly logger = new Logger(OtpSenderService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Dispatches OTP via apitxt.com API.
   * Fully configurable via .env variables:
   * - If APITXT_AUTH_KEY is not configured: runs in simulation mode (logs OTP, doesn't fail).
   * - If APITXT_TEMPLATE_ID / APITXT_TEMPLATE_NAME are configured: uses custom template.
   * - Otherwise: uses apitxt default system template.
   */
  async sendOtp(options: SendOtpOptions): Promise<SendOtpResult> {
    const authKey = this.configService.get<string>('APITXT_AUTH_KEY')?.trim();
    const baseUrl =
      this.configService.get<string>('APITXT_BASE_URL')?.trim() ||
      'https://apitxt.com/api/sendOTP';
    const defaultCountry =
      this.configService.get<string>('APITXT_DEFAULT_COUNTRY')?.trim() || '91';

    // 1. Normalize mobile number
    const cleanedDigits = options.mobile.replace(/\D/g, '');
    const country = options.country || defaultCountry;

    let formattedMobile = cleanedDigits;
    // If Indian 10-digit number, prepend 91
    if (country === '91' && cleanedDigits.length === 10) {
      formattedMobile = `91${cleanedDigits}`;
    }

    // 2. Check if auth key is provided
    if (!authKey) {
      this.logger.warn(
        `[OtpSenderService] APITXT_AUTH_KEY is not configured in .env. Simulated OTP dispatch to ${formattedMobile}: [OTP: ${options.otp}]`,
      );
      return {
        success: true,
        simulated: true,
        message: 'OTP dispatch simulated (APITXT_AUTH_KEY not configured).',
      };
    }

    // 3. Build API request URL with dynamic parameters
    try {
      const url = new URL(baseUrl);
      url.searchParams.set('authkey', authKey);
      url.searchParams.set('mobile', formattedMobile);
      url.searchParams.set('otp', options.otp);

      // Channel: SMS, WhatsApp, Voice (if configured)
      const channel =
        options.channel ||
        this.configService.get<string>('APITXT_CHANNEL')?.trim()?.toLowerCase();
      if (channel) {
        url.searchParams.set('channel', channel);
      }

      // Template ID (if configured in options or .env)
      const templateId =
        options.templateId ??
        this.configService.get<string>('APITXT_TEMPLATE_ID')?.trim();
      if (templateId) {
        url.searchParams.set('template_id', String(templateId));
      }

      // Template Name (if configured in options or .env)
      const templateName =
        options.templateName ||
        this.configService.get<string>('APITXT_TEMPLATE_NAME')?.trim();
      if (templateName) {
        url.searchParams.set('template_name', templateName);
      }

      // Project Ref ID (e.g. for WhatsApp WABA project)
      const projectRefId =
        options.projectRefId ||
        this.configService.get<string>('APITXT_PROJECT_REF_ID')?.trim();
      if (projectRefId) {
        url.searchParams.set('project_ref_id', projectRefId);
      }

      // Country parameter for international numbers
      if (options.country && options.country !== '91') {
        url.searchParams.set('country', options.country);
      }

      this.logger.log(
        `[OtpSenderService] Sending OTP to ${formattedMobile} via ${channel || 'sms'} (template: ${
          templateId || templateName || 'system_default'
        })...`,
      );

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json, text/plain, */*',
        },
      });

      const responseText = await response.text();
      let responseData: any = responseText;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        // Response was plain text or html
      }

      if (!response.ok) {
        this.logger.error(
          `[OtpSenderService] HTTP ${response.status} Error from apitxt: ${responseText}`,
        );
        return {
          success: false,
          message: `Gateway responded with HTTP ${response.status}`,
          rawResponse: responseData,
        };
      }

      this.logger.log(`[OtpSenderService] Gateway response: ${responseText}`);
      return {
        success: true,
        message: 'OTP sent successfully via gateway.',
        rawResponse: responseData,
      };
    } catch (error: any) {
      this.logger.error(`[OtpSenderService] Network error sending OTP to ${formattedMobile}:`, error);
      return {
        success: false,
        message: error.message || 'Network error communicating with OTP gateway.',
      };
    }
  }
}
