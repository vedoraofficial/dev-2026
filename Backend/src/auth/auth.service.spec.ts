import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AuthService } from './auth.service';
import { BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';

describe('AuthService Security Remediation', () => {
  let authService: AuthService;
  let mockUserService: any;
  let mockJwtService: any;
  let mockOtpRepo: any;
  let mockNotificationService: any;

  beforeEach(() => {
    mockUserService = {
      findByVedId: vi.fn(),
      save: vi.fn(),
    };
    mockJwtService = {
      signAsync: vi.fn(),
    };
    mockOtpRepo = {
      create: vi.fn((data) => ({ id: 1, ...data })),
      save: vi.fn(async (entity) => entity),
      findOne: vi.fn(),
      update: vi.fn(),
    };
    mockNotificationService = {
      create: vi.fn(),
    };

    authService = new AuthService(
      mockUserService,
      mockJwtService,
      mockOtpRepo,
      mockNotificationService,
    );
  });

  describe('forgotPassword', () => {
    it('should NEVER return resetToken in production environment', async () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      mockUserService.findByVedId.mockResolvedValue({ id: 10, vedId: 'VED100' });

      const res = await authService.forgotPassword({ vedId: 'VED100' });

      expect(res).not.toHaveProperty('resetToken');
      expect(res.message).toContain('password reset code has been sent');

      // Verify that the OTP saved in DB is a 64-char SHA-256 hash (not plaintext)
      expect(mockOtpRepo.save).toHaveBeenCalled();
      const savedOtp = mockOtpRepo.create.mock.calls[0][0];
      expect(savedOtp.otpCode).toHaveLength(64); // SHA-256 hex digest length
      expect(savedOtp.purpose).toBe('PASSWORD_RESET');

      process.env.NODE_ENV = originalEnv;
    });

    it('should invalidate previous unused reset tokens for the user', async () => {
      mockUserService.findByVedId.mockResolvedValue({ id: 10, vedId: 'VED100' });

      await authService.forgotPassword({ vedId: 'VED100' });

      expect(mockOtpRepo.update).toHaveBeenCalledWith(
        { user: { id: 10 }, purpose: 'PASSWORD_RESET', isUsed: false },
        { isUsed: true },
      );
    });

    it('should prevent user enumeration by returning standard response if user not found', async () => {
      mockUserService.findByVedId.mockResolvedValue(null);

      const res = await authService.forgotPassword({ vedId: 'NONEXISTENT' });

      expect(res.message).toContain('If the account exists');
      expect(mockOtpRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('should match incoming plaintext token against stored SHA-256 hash', async () => {
      const plaintextToken = '654321';
      const hashedToken = createHash('sha256').update(plaintextToken).digest('hex');

      mockUserService.findByVedId.mockResolvedValue({ id: 10, vedId: 'VED100' });
      mockOtpRepo.findOne.mockResolvedValue({
        id: 1,
        otpCode: hashedToken,
        purpose: 'PASSWORD_RESET',
        isUsed: false,
        expiresAt: new Date(Date.now() + 60000),
      });

      const res = await authService.resetPassword({
        vedId: 'VED100',
        resetToken: plaintextToken,
        newPassword: 'NewSecurePassword123!',
      });

      expect(res.success).toBe(true);
      expect(mockUserService.save).toHaveBeenCalled();
      expect(mockOtpRepo.update).toHaveBeenCalledWith(
        { user: { id: 10 }, purpose: 'PASSWORD_RESET' },
        { isUsed: true },
      );
    });

    it('should reject invalid or expired reset token', async () => {
      mockUserService.findByVedId.mockResolvedValue({ id: 10, vedId: 'VED100' });
      mockOtpRepo.findOne.mockResolvedValue(null);

      await expect(
        authService.resetPassword({
          vedId: 'VED100',
          resetToken: 'wrongtoken',
          newPassword: 'Password123!',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should increment attemptsCount on wrong token and invalidate after 5 failed attempts', async () => {
      const storedOtp = {
        id: 1,
        otpCode: 'hashed_correct_token',
        purpose: 'PASSWORD_RESET',
        isUsed: false,
        attemptsCount: 4,
        expiresAt: new Date(Date.now() + 60000),
      };

      mockUserService.findByVedId.mockResolvedValue({ id: 10, vedId: 'VED100' });
      mockOtpRepo.findOne.mockResolvedValue(storedOtp);

      // Attempt 5 with wrong token
      await expect(
        authService.resetPassword({
          vedId: 'VED100',
          resetToken: 'wrong_guess',
          newPassword: 'Password123!',
        }),
      ).rejects.toThrow('Invalid reset token');

      expect(storedOtp.attemptsCount).toBe(5);
      expect(storedOtp.isUsed).toBe(true);
      expect(mockOtpRepo.save).toHaveBeenCalledWith(storedOtp);
    });

    it('should immediately reject if attemptsCount already reached 5', async () => {
      const lockedOtp = {
        id: 1,
        otpCode: 'hashed_correct_token',
        purpose: 'PASSWORD_RESET',
        isUsed: false,
        attemptsCount: 5,
        expiresAt: new Date(Date.now() + 60000),
      };

      mockUserService.findByVedId.mockResolvedValue({ id: 10, vedId: 'VED100' });
      mockOtpRepo.findOne.mockResolvedValue(lockedOtp);

      await expect(
        authService.resetPassword({
          vedId: 'VED100',
          resetToken: 'any_guess',
          newPassword: 'Password123!',
        }),
      ).rejects.toThrow('Too many failed attempts');

      expect(lockedOtp.isUsed).toBe(true);
    });
  });
});
