import { Injectable, UnauthorizedException, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { UserStatus } from '../user/entity/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
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

    // Generate a simple 6-digit OTP as the reset token
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Set expiry to 15 minutes from now
    const expires = new Date();
    expires.setMinutes(expires.getMinutes() + 15);

    user.resetToken = resetToken;
    user.resetTokenExpires = expires;
    await this.userService.save(user);

    // In a real app, send this via Email/SMS. Here we just return it.
    return { 
      message: 'Password reset token generated (normally sent via email/SMS).', 
      resetToken 
    };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.userService.findByVedId(dto.vedId);
    if (!user) throw new NotFoundException('User not found');

    if (!user.resetToken || user.resetToken !== dto.resetToken) {
      throw new BadRequestException('Invalid reset token');
    }

    if (!user.resetTokenExpires || user.resetTokenExpires < new Date()) {
      throw new BadRequestException('Reset token has expired');
    }

    // Token is valid. Update password.
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    user.resetToken = null; // Clear token
    user.resetTokenExpires = null;
    await this.userService.save(user);

    return { success: true, message: 'Password reset successfully' };
  }
}
