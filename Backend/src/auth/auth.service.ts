import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserStatus } from '../user/entity/user.entity';
import { Otp } from './entity/otp.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    @InjectRepository(Otp)
    private readonly otpRepo: Repository<Otp>,
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
    if (!user) throw new NotFoundException('User not found');

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    const otp = this.otpRepo.create({
      otpCode,
      purpose: 'PASSWORD_RESET',
      expiresAt,
      user,
    });
    
    await this.otpRepo.save(otp);

    return { 
      message: 'Password reset OTP generated (normally sent via email/SMS).', 
      resetToken: otpCode 
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userService.findByVedId(dto.vedId);
    if (!user) throw new NotFoundException('User not found');

    const otp = await this.otpRepo.findOne({
      where: { 
        user: { id: user.id }, 
        otpCode: dto.resetToken, 
        purpose: 'PASSWORD_RESET', 
        isUsed: false 
      },
      order: { createdAt: 'DESC' } // get the latest one
    });

    if (!otp) {
      throw new BadRequestException('Invalid reset token');
    }

    if (otp.expiresAt < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // Token is valid. Update password.
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userService.save(user);

    // Mark OTP as used
    otp.isUsed = true;
    await this.otpRepo.save(otp);

    return { success: true, message: 'Password reset successfully' };
  }
}
