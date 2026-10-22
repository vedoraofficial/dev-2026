import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { OAuth2Client } from 'google-auth-library';

export interface SendMailResult {
  success: boolean;
  message: string;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

@Injectable()
export class MailService implements OnModuleInit {
  private readonly logger = new Logger(MailService.name);
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured = false;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.initializeTransporter();
  }

  private async initializeTransporter(): Promise<void> {
    const clientId = this.configService.get<string>('GMAIL_CLIENT_ID')?.trim();
    const clientSecret = this.configService.get<string>('GMAIL_CLIENT_SECRET')?.trim();
    const refreshToken = this.configService.get<string>('GMAIL_REFRESH_TOKEN')?.trim();
    const user = this.configService.get<string>('SMTP_USER')?.trim() || 'info@vedoraofficial.com';

    if (!clientId || !clientSecret || !refreshToken) {
      this.logger.warn(
        '[MailService] Gmail OAuth2 credentials missing in .env (GMAIL_CLIENT_ID, GMAIL_CLIENT_SECRET, GMAIL_REFRESH_TOKEN). ' +
        'MailService running in SIMULATION mode. Emails will be logged to console.',
      );
      this.isConfigured = false;
      return;
    }

    try {
      this.logger.log(`[MailService] Initializing OAuth2 transporter for ${user}...`);

      const oauth2Client = new OAuth2Client({
        clientId,
        clientSecret,
        redirectUri: 'https://developers.google.com/oauthplayground',
      });

      oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const tokenResponse = await oauth2Client.getAccessToken();
      const accessToken = tokenResponse.token;

      if (!accessToken) {
        throw new Error('Failed to retrieve access token from Google OAuth2 client');
      }

      this.transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          type: 'OAuth2',
          user,
          clientId,
          clientSecret,
          refreshToken,
          accessToken,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await this.transporter.verify();
      this.isConfigured = true;
      this.logger.log(`[MailService] Google OAuth2 Mail Transporter verified successfully for ${user}`);
    } catch (error: any) {
      this.logger.error(`[MailService] Failed to initialize Google OAuth2 transporter: ${error.message}`);
      this.logger.warn('[MailService] Falling back to simulation mode to avoid application interruption.');
      this.isConfigured = false;
    }
  }


  async sendMail(to: string, subject: string, text: string): Promise<SendMailResult> {
    const sender = this.configService.get<string>('SMTP_USER')?.trim() || 'info@vedoraofficial.com';

    if (!this.isConfigured || !this.transporter) {
      this.logger.log(
        `[SIMULATED EMAIL] To: ${to} | Subject: "${subject}" | Content Preview: ${text.slice(0, 100)}...`,
      );
      return {
        success: true,
        simulated: true,
        message: 'Email simulated (OAuth2 not configured or unavailable)',
      };
    }

    try {
      this.logger.log(`[MailService] Sending email to ${to}: "${subject}"`);
      const info = await this.transporter.sendMail({
        from: `"Vedora Official" <${sender}>`,
        to,
        subject,
        text,
      });

      this.logger.log(`[MailService] Email sent successfully! MessageId: ${info.messageId}`);
      return {
        success: true,
        message: 'Email sent successfully',
        messageId: info.messageId,
      };
    } catch (error: any) {
      this.logger.error(`[MailService] Error sending email to ${to}: ${error.message}`);
      return {
        success: false,
        message: 'Failed to send email',
        error: error.message,
      };
    }
  }


  async sendRegistrationEmail(
    to: string,
    data: { name: string; vedId: string; email: string; mobile: string },
  ): Promise<SendMailResult> {
    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL')?.trim() || 'https://vedoraofficial.com';
    const loginUrl = `${frontendUrl}/login`;

    const text = `Dear ${data.name},

Welcome to VEDORA!

Your partner account has been successfully created. Here are your account details:

  Partner VED ID: ${data.vedId}
  Registered Email: ${data.email}
  Mobile Number: ${data.mobile}

You can access your partner portal and sign in at:
${loginUrl}

Please keep your VED ID safe. You will need it along with your password to log in.

If you have any questions or require support, please feel free to reach out to us at info@vedoraofficial.com.

Warm regards,
Team VEDORA
www.vedoraofficial.com`;

    return this.sendMail(to, `Welcome to Vedora - Your VED ID is ${data.vedId}`, text);
  }

  async sendWithdrawalRequestedEmail(
    to: string,
    data: {
      name: string;
      vedId: string;
      withdrawalId: number;
      amountFormatted: string;
      bankMasked: string;
      requestedAt?: string;
    },
  ): Promise<SendMailResult> {
    const requestedAt =
      data.requestedAt ||
      new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      });

    const text = `Dear ${data.name},

We have received your payout withdrawal request.

Details of your request:
  Request ID: #${data.withdrawalId}
  Requested Amount: ${data.amountFormatted}
  Beneficiary Bank: ${data.bankMasked}
  Requested On: ${requestedAt}
  Status: PENDING REVIEW

Your funds have been locked in your wallet balance and will be processed according to our payout settlement schedule. You will receive an update once the disbursement is complete.

Warm regards,
Team VEDORA
info@vedoraofficial.com`;

    return this.sendMail(
      to,
      `Payout Request Received (#${data.withdrawalId}) - Vedora`,
      text,
    );
  }


  async sendPayoutDisbursedEmail(
    to: string,
    data: {
      name: string;
      vedId: string;
      withdrawalId: number;
      amountFormatted: string;
      bankMasked: string;
      utr?: string | null;
      disbursedAt?: string;
    },
  ): Promise<SendMailResult> {
    const disbursedAt =
      data.disbursedAt ||
      new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'medium',
        timeStyle: 'short',
      });

    const utrLine = data.utr ? `\n  Bank Reference / UTR: ${data.utr}` : '';

    const text = `Dear ${data.name},

We are pleased to inform you that your withdrawal request #${data.withdrawalId} has been approved and disbursed.

Disbursement Summary:
  Amount Transferred: ${data.amountFormatted}
  Bank Account: ${data.bankMasked}${utrLine}
  Disbursed On: ${disbursedAt}
  Status: COMPLETED

Depending on your bank, the funds should reflect in your account shortly. If you have any inquiries regarding this transfer, please reference the UTR number with your branch or contact our support team.

Warm regards,
Team VEDORA
info@vedoraofficial.com`;

    return this.sendMail(
      to,
      `Payment Disbursed - ${data.amountFormatted} (#${data.withdrawalId}) - Vedora`,
      text,
    );
  }
}
