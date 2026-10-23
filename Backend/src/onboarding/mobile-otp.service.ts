import { BadRequestException, ConflictException, Injectable, Logger, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { MoreThan, Repository } from 'typeorm';
import { randomInt, createHash } from 'crypto';
import { User } from '../user/entity/user.entity';
import { OtpSenderService } from '../notification/otp-sender.service';
import { MobileOtp, MobileOtpPurpose } from './entity/mobile-otp.entity';

/** How long a sent OTP can be entered */
const OTP_VALID_MINUTES = 10;
/** How long a verified number stays good for registering the partner */
const VERIFIED_VALID_MINUTES = 30;
/** Wrong attempts before the OTP is locked */
const MAX_ATTEMPTS = 5;
/** Seconds before the same number can be sent another OTP (the join page is public) */
const RESEND_AFTER_SECONDS = 30;

const hashOtp = (otp: string) => createHash('sha256').update(otp).digest('hex');

/**
 * Add Partner and the referral join page: the new partner's mobile number is verified with an SMS
 * OTP before the registration (and its payment) is accepted. `requestedBy` is the sponsor.
 */
@Injectable()
export class MobileOtpService {
  private readonly logger = new Logger(MobileOtpService.name);

  constructor(
    @InjectRepository(MobileOtp)
    private readonly mobileOtpRepo: Repository<MobileOtp>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @Optional()
    private readonly otpSenderService?: OtpSenderService,
  ) {}

  async send(requestedBy: number, mobile: string, purpose: MobileOtpPurpose = 'ADD_PARTNER') {
    if (await this.userRepo.exists({ where: { mobile } })) {
      throw new ConflictException('This mobile number is already registered.');
    }

    const resendFrom = new Date(Date.now() - RESEND_AFTER_SECONDS * 1000);
    if (await this.mobileOtpRepo.exists({ where: { mobile, createdAt: MoreThan(resendFrom) } })) {
      throw new BadRequestException(`An OTP was just sent to this number. Wait ${RESEND_AFTER_SECONDS} seconds to resend.`);
    }

    // Only the newest OTP for this number works
    await this.mobileOtpRepo.update({ mobile, requestedBy, purpose, isUsed: false }, { isUsed: true });

    // Cryptographically secure 6-digit OTP
    const otpCode = randomInt(100000, 1000000).toString();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + OTP_VALID_MINUTES);

    await this.mobileOtpRepo.save(
      this.mobileOtpRepo.create({ mobile, otpCode: hashOtp(otpCode), requestedBy, purpose, expiresAt }),
    );

    if (this.otpSenderService) {
      const sent = await this.otpSenderService.sendOtp({ mobile, otp: otpCode });
      if (!sent.success) {
        this.logger.error(`Failed to send ${purpose} OTP to ${mobile}: ${sent.message}`);
        throw new BadRequestException("Couldn't send the OTP. Please try again.");
      }
    }
    this.logger.log(`[SMS Gateway Dispatch] ${purpose} OTP dispatched to ${mobile} (sponsor user #${requestedBy})`);

    const response: { message: string; expiresInSeconds: number; otp?: string } = {
      message: `OTP sent to ${mobile}.`,
      expiresInSeconds: OTP_VALID_MINUTES * 60,
    };
    // Expose the OTP in test environment for automated test suites
    if (process.env.NODE_ENV === 'test') response.otp = otpCode;
    return response;
  }

  async verify(requestedBy: number, mobile: string, otpInput: string, purpose: MobileOtpPurpose = 'ADD_PARTNER') {
    const otp = await this.mobileOtpRepo.findOne({
      where: { mobile, requestedBy, purpose, isUsed: false },
      order: { createdAt: 'DESC' },
    });

    if (!otp) {
      throw new BadRequestException('No OTP found for this number. Tap Send OTP.');
    }
    if (otp.expiresAt < new Date()) {
      throw new BadRequestException('This OTP has expired. Tap Resend OTP for a new one.');
    }
    if (otp.otpCode !== hashOtp(otpInput)) {
      otp.attemptsCount = (otp.attemptsCount || 0) + 1;
      // Lockout protection: max 5 failed attempts per OTP
      if (otp.attemptsCount >= MAX_ATTEMPTS) {
        otp.isUsed = true;
        await this.mobileOtpRepo.save(otp);
        throw new BadRequestException('Too many wrong attempts. Tap Resend OTP for a new one.');
      }
      await this.mobileOtpRepo.save(otp);
      throw new BadRequestException('Incorrect OTP. Check the code and try again.');
    }

    if (!otp.verifiedAt) {
      otp.verifiedAt = new Date();
      await this.mobileOtpRepo.save(otp);
    }
    return { verified: true, mobile, message: 'Mobile number verified.' };
  }

  /** Throws unless this sponsor verified this mobile number with an OTP in the last 30 minutes. */
  async assertVerified(requestedBy: number, mobile: string, purpose: MobileOtpPurpose = 'ADD_PARTNER') {
    const since = new Date();
    since.setMinutes(since.getMinutes() - VERIFIED_VALID_MINUTES);

    const verified = await this.mobileOtpRepo.exists({
      where: { mobile, requestedBy, purpose, isUsed: false, verifiedAt: MoreThan(since) },
    });
    if (!verified) {
      throw new BadRequestException(
        purpose === 'JOIN'
          ? 'Verify your mobile number with OTP first.'
          : "Verify the new partner's mobile number with OTP first.",
      );
    }
  }
}
