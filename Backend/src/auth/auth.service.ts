import { Injectable, UnauthorizedException, ForbiddenException, BadRequestException, Logger, Optional } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomInt, createHash } from 'crypto';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserStatus } from '../user/entity/user.entity';
import { Otp } from './entity/otp.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { NotificationService } from '../notification/notification.service';
import { NotificationKey } from '../notification/notification.constants';
import { OtpSenderService } from '../notification/otp-sender.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(Otp)
    private readonly otpRepo: Repository<Otp>,
    private readonly notificationService: NotificationService,
    @Optional()
    private readonly otpSenderService?: OtpSenderService,
  ) {}

  async login(dto: LoginDto) {
    const user = await this.userService.findByVedId(dto.vedId);
    if (!user) throw new UnauthorizedException('Invalid VED ID or password');

    if (user.status === UserStatus.BLOCKED) {
      throw new ForbiddenException('Account is blocked');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordValid) throw new UnauthorizedException('Invalid VED ID or password');

    const payload = { sub: user.id, vedId: user.vedId, role: user.role };

    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        vedId: user.vedId
      }
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.userService.findByVedId(dto.vedId);
    if (!user) {
      // Prevent user enumeration: return generic response
      return { message: 'If the account exists, a password reset code has been sent.' };
    }

    // Invalidate existing unused password reset OTPs for this user
    await this.otpRepo.update(
      { user: { id: user.id }, purpose: 'PASSWORD_RESET', isUsed: false },
      { isUsed: true },
    );

    // Cryptographically secure 6-digit OTP
    const otpCode = randomInt(100000, 1000000).toString();
    const hashedOtp = createHash('sha256').update(otpCode).digest('hex');

    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const otp = this.otpRepo.create({
      otpCode: hashedOtp,
      purpose: 'PASSWORD_RESET',
      expiresAt,
      user,
    });

    await this.otpRepo.save(otp);

    // Dispatch real OTP via apitxt gateway if user has mobile registered
    if (user.mobile && this.otpSenderService) {
      try {
        await this.otpSenderService.sendOtp({
          mobile: user.mobile,
          otp: otpCode,
        });
      } catch (err: any) {
        this.logger.error(
          `Failed to send password reset OTP to ${user.mobile}: ${err?.message || err}`,
        );
      }
    }

    const response: { message: string; resetToken?: string } = {
      message: 'If the account exists, a password reset code has been sent.',
    };

    // Expose resetToken in test environment for automated test suites
    if (process.env.NODE_ENV === 'test') {
      response.resetToken = otpCode;
    } else {
      this.logger.log(`[SMS Gateway Dispatch] Password reset code dispatched to ${user.mobile} (${user.vedId})`);
    }

    return response;
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userService.findByVedId(dto.vedId);
    if (!user) throw new BadRequestException('Invalid reset token');

    const hashedToken = createHash('sha256').update(dto.resetToken).digest('hex');

    const otp = await this.otpRepo.findOne({
      where: {
        user: { id: user.id },
        purpose: 'PASSWORD_RESET',
        isUsed: false,
      },
      order: { createdAt: 'DESC' },
    });

    if (!otp) {
      throw new BadRequestException('Invalid reset token');
    }

    if (otp.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // Lockout protection: Max 5 failed attempts per OTP
    if ((otp.attemptsCount || 0) >= 5) {
      otp.isUsed = true;
      await this.otpRepo.save(otp);
      throw new BadRequestException('Too many failed attempts. This reset token has been invalidated. Please request a new one.');
    }

    if (otp.otpCode !== hashedToken) {
      otp.attemptsCount = (otp.attemptsCount || 0) + 1;
      if (otp.attemptsCount >= 5) {
        otp.isUsed = true;
      }
      await this.otpRepo.save(otp);
      throw new BadRequestException('Invalid reset token');
    }

    // Token is valid. Update password.
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userService.save(user);

    // Mark all unused password reset OTPs as used
    await this.otpRepo.update(
      { user: { id: user.id }, purpose: 'PASSWORD_RESET' },
      { isUsed: true },
    );

    // In-app Notification: AUTH_PASSWORD_RESET_DONE
    const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    await this.notificationService.create(
      user.id,
      NotificationKey.AUTH_PASSWORD_RESET_DONE,
      'Your password was reset',
      `The password for ${user.vedId} was reset on ${nowStr}. If this wasn't you, contact support.`,
      { vedId: user.vedId, dateTime: nowStr },
    );

    return { success: true, message: 'Password reset successfully' };
  }
}
