import { Injectable, ConflictException, NotFoundException, BadRequestException, Optional } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from './entity/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AddBankDetailsDto } from './dto/bank-details.dto';
import { UpdateProfileDetailsDto } from './dto/profile-details.dto';
import { UserBank, BankVerificationStatus } from './entity/user-bank.entity';
import { UserProfile } from './entity/user-profile.entity';
import { generateNextVedId } from '../common/utils/ved-id.generator';
import { RazorpayBankVerificationService } from '../bank-verification/razorpay-bank-verification.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationKey } from '../notification/notification.constants';
import { MailService } from '../notification/mail.service';
import { WalletService } from '../wallet/wallet.service';
import { Order } from '../order/entity/order.entity';
import { WalletTransaction } from '../wallet/entity/wallet-transaction.entity';
import { Withdrawal } from '../wallet/entity/withdrawal.entity';
import { GenealogyNode } from '../genealogy/entity/genealogy-node.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserBank)
    private readonly userBankRepo: Repository<UserBank>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepo: Repository<UserProfile>,
    private readonly bankVerificationService: RazorpayBankVerificationService,
    private readonly notificationService: NotificationService,
    private readonly walletService: WalletService,
    @Optional()
    private readonly mailService?: MailService,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email }, { mobile: dto.mobile }],
    });

    if (existing) {
      throw new ConflictException('Email or mobile already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const vedId = await generateNextVedId(this.userRepo.manager);

    const user = this.userRepo.create({
      vedId,
      name: dto.name,
      email: dto.email,
      mobile: dto.mobile,
      passwordHash,
      role: UserRole.PARTNER,
      status: UserStatus.PENDING,
    });

    const saved = await this.userRepo.save(user);

    // Ensure wallet is created immediately for the new user
    await this.walletService.createWallet(saved.id);

    if (this.mailService && saved.email) {
      this.mailService
        .sendRegistrationEmail(saved.email, {
          name: saved.name,
          vedId: saved.vedId,
          email: saved.email,
          mobile: saved.mobile,
        })
        .catch(() => {});
    }

    return saved;
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepo.findOne({ where: { id } });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { email } });
  }

  async findByVedId(vedId: string): Promise<User | null> {
    return this.userRepo.findOne({ where: { vedId } });
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    if (dto.email && dto.email !== user.email) {
      const emailExists = await this.findByEmail(dto.email);
      if (emailExists) throw new ConflictException('Email already in use');
    }

    if (dto.mobile && dto.mobile !== user.mobile) {
      const mobileExists = await this.userRepo.findOne({ where: { mobile: dto.mobile } });
      if (mobileExists) throw new ConflictException('Mobile number already in use');
    }

    const oldMobile = user.mobile;
    const oldEmail = user.email;

    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email;
    if (dto.mobile) user.mobile = dto.mobile;

    const saved = await this.userRepo.save(user);

    // In-app Notification: ACCOUNT_CONTACT_CHANGED (if mobile or email updated)
    if ((dto.mobile && dto.mobile !== oldMobile) || (dto.email && dto.email !== oldEmail)) {
      const field = dto.mobile && dto.mobile !== oldMobile ? 'mobile' : 'email';
      const oldValue = field === 'mobile' ? oldMobile : oldEmail;
      const newValue = field === 'mobile' ? dto.mobile : dto.email;
      const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

      await this.notificationService.create(
        user.id,
        NotificationKey.ACCOUNT_CONTACT_CHANGED,
        'Contact details updated',
        `Your ${field} was changed from ${oldValue} to ${newValue} on ${nowStr}.`,
        { field, oldValue, newValue, dateTime: nowStr },
      );
    }

    return saved;
  }

  async changePassword(id: number, dto: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(id);

    const passwordValid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!passwordValid) {
      return { success: false, message: 'old password didnt match' };
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.save(user);

    // In-app Notification: ACCOUNT_PASSWORD_CHANGED
    const nowStr = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
    await this.notificationService.create(
      user.id,
      NotificationKey.ACCOUNT_PASSWORD_CHANGED,
      'Password changed',
      `Your password was changed on ${nowStr}. If this wasn't you, reset it now.`,
      { dateTime: nowStr },
    );
    
    return { success: true, message: 'successfully changed' };
  }

  async save(user: User): Promise<User> {
    return this.userRepo.save(user);
  }

  async delete(id: number): Promise<{ message: string }> {
    const user = await this.findById(id);

    // Safeguard 1: Disallow deleting administrators or root accounts
    if (user.role === UserRole.ADMIN || user.vedId === 'VED108') {
      throw new BadRequestException('Cannot delete an administrator or root account.');
    }

    // Safeguard 2: Prevent deletion if user has existing orders
    const orderCount = await this.userRepo.manager.count(Order, { where: { userId: user.id } });
    if (orderCount > 0) {
      throw new BadRequestException('Cannot delete user with existing orders. Set status to BLOCKED or INACTIVE instead.');
    }

    // Safeguard 3: Prevent deletion if user has financial transaction history
    const txnCount = await this.userRepo.manager.count(WalletTransaction, {
      where: { wallet: { userId: user.id } },
    });
    if (txnCount > 0) {
      throw new BadRequestException('Cannot delete user with financial transaction history.');
    }

    // Safeguard 4: Prevent deletion if user has withdrawal records
    const withdrawalCount = await this.userRepo.manager.count(Withdrawal, {
      where: { userId: user.id },
    });
    if (withdrawalCount > 0) {
      throw new BadRequestException('Cannot delete user with withdrawal payout history. Set status to BLOCKED or INACTIVE instead.');
    }

    // Safeguard 5: Prevent deletion if user is a sponsor/parent to downlines in the genealogy tree
    const downlineCount = await this.userRepo.manager.count(GenealogyNode, {
      where: { parentUserId: user.id },
    });
    if (downlineCount > 0) {
      throw new BadRequestException(
        'Cannot delete user who has downline partners in the genealogy tree. Set status to BLOCKED or INACTIVE instead.',
      );
    }

    await this.userRepo.remove(user);
    return { message: 'User deleted successfully' };
  }

  async changeStatus(id: number, dto: UpdateUserStatusDto): Promise<User> {
    const user = await this.findById(id);

    if (dto.status === UserStatus.BLOCKED && (user.role === 'ADMIN' || user.vedId === 'VED108')) {
      throw new BadRequestException('Cannot block an administrator or root account.');
    }

    user.status = dto.status;
    const updated = await this.userRepo.save(user);

    // In-app Notification: ACCOUNT_STATUS_CHANGED
    const statusNote =
      dto.status === 'ACTIVE'
        ? 'commissions will be credited.'
        : dto.status === 'INACTIVE'
          ? 'no commission.'
          : 'contact support.';

    await this.notificationService.create(
      user.id,
      NotificationKey.ACCOUNT_STATUS_CHANGED,
      `Your ID is now ${dto.status}`,
      `Your ID ${user.vedId} is ${dto.status}. (${dto.status}: ${statusNote})`,
      { vedId: user.vedId, status: dto.status },
    );

    return updated;
  }

  async getBankAccounts(userId: number): Promise<UserBank[]> {
    return this.userBankRepo.find({ where: { user: { id: userId } }, order: { isPrimary: 'DESC', createdAt: 'DESC' } });
  }

  async addBankAccount(userId: number, dto: AddBankDetailsDto): Promise<UserBank> {
    const user = await this.findById(userId);
    const existingBanks = await this.userBankRepo.find({ where: { user: { id: userId } } });

    // Validate IFSC and Account Number formats upfront
    const ifscUpper = (dto.ifscCode || '').trim().toUpperCase();
    const accountNum = (dto.accountNumber || '').trim();

    if (!this.bankVerificationService.validateIfsc(ifscUpper)) {
      throw new BadRequestException(
        `Invalid IFSC code format: "${ifscUpper}". Must be 11 characters (e.g. SBIN0000284).`,
      );
    }
    if (!this.bankVerificationService.validateAccountNumber(accountNum)) {
      throw new BadRequestException(
        'Invalid bank account number. Must contain 5 to 35 alphanumeric characters.',
      );
    }

    const duplicate = existingBanks.find((b) => b.accountNumber === accountNum);
    if (duplicate) {
      throw new ConflictException('This bank account has already been added to your profile.');
    }

    // If it's the first bank, force it to be primary regardless of what they passed
    let isPrimary = existingBanks.length === 0 ? true : (dto.isPrimary || false);

    // If they are setting this new one as primary, downgrade all others
    if (isPrimary && existingBanks.length > 0) {
      await this.userBankRepo.update({ user: { id: userId } }, { isPrimary: false });
    }

    // Trigger RazorpayX Penny Drop Verification
    const verification = await this.bankVerificationService.verifyBankAccount({
      accountNumber: accountNum,
      ifscCode: ifscUpper,
      accountHolderName: dto.accountHolderName,
      userName: user.name,
      phone: user.mobile,
    });

    const isVerified = verification.isValid && verification.accountStatus === 'VALID';

    // REQUIREMENT: Must be verified by penny drop before saving; otherwise fail and do not save!
    if (!isVerified) {
      throw new BadRequestException(
        verification.failureReason ||
          'Bank account verification failed via RazorpayX penny drop. Please check your account number and IFSC code.',
      );
    }

    const newBank = this.userBankRepo.create({
      user,
      accountHolderName: dto.accountHolderName,
      accountNumber: accountNum,
      bankName: dto.bankName,
      ifscCode: ifscUpper,
      isPrimary,
      verificationStatus: BankVerificationStatus.VERIFIED,
      verifiedName: verification.registeredName || dto.accountHolderName,
      nameMatchScore: verification.nameMatchScore,
      nameMatchResult: verification.nameMatchResult,
      utr: verification.utr || null,
      verificationReferenceId: verification.referenceId || null,
      verificationFailedReason: null,
      verifiedAt: new Date(),
    });

    const savedBank = await this.userBankRepo.save(newBank);
    const bankMasked = `${dto.bankName} (XX${accountNum.slice(-4)})`;

    // In-app Notification: BANK_VERIFIED
    await this.notificationService.create(
      userId,
      NotificationKey.BANK_VERIFIED,
      'Bank account verified',
      `${bankMasked} was verified via RazorpayX penny drop and added to your profile. You can withdraw to it.`,
      { bankId: savedBank.id, bankMasked, status: savedBank.verificationStatus },
    );

    return savedBank;
  }

  async verifyExistingBankAccount(userId: number, bankId: number): Promise<UserBank> {
    const bank = await this.userBankRepo.findOne({
      where: { id: bankId, user: { id: userId } },
      relations: { user: true },
    });
    if (!bank) throw new NotFoundException('Bank account not found');

    if (bank.verificationStatus === BankVerificationStatus.VERIFIED) {
      throw new BadRequestException('This bank account is already verified.');
    }

    const verification = await this.bankVerificationService.verifyBankAccount({
      accountNumber: bank.accountNumber,
      ifscCode: bank.ifscCode,
      accountHolderName: bank.accountHolderName,
      userName: bank.user?.name,
      phone: bank.user?.mobile,
    });

    const isVerified = verification.isValid && verification.accountStatus === 'VALID';

    if (!isVerified) {
      bank.verificationStatus = BankVerificationStatus.REJECTED;
      bank.verificationFailedReason = verification.failureReason || 'Verification failed';
      await this.userBankRepo.save(bank);
      throw new BadRequestException(
        verification.failureReason || 'Bank account verification failed via RazorpayX penny drop.',
      );
    }

    bank.verificationStatus = BankVerificationStatus.VERIFIED;
    bank.verifiedName = verification.registeredName || bank.accountHolderName;
    bank.nameMatchScore = verification.nameMatchScore;
    bank.nameMatchResult = verification.nameMatchResult;
    bank.utr = verification.utr || null;
    bank.verificationReferenceId = verification.referenceId || null;
    bank.verificationFailedReason = null;
    bank.verifiedAt = new Date();

    const saved = await this.userBankRepo.save(bank);
    const bankMasked = `${bank.bankName} (XX${bank.accountNumber.slice(-4)})`;

    // In-app Notification: BANK_VERIFIED
    await this.notificationService.create(
      userId,
      NotificationKey.BANK_VERIFIED,
      'Bank account verified',
      `${bankMasked} is verified via RazorpayX penny drop, you can now withdraw to it.`,
      { bankId: bank.id, bankMasked, status: bank.verificationStatus },
    );

    return saved;
  }

  async adminVerifyBankAccount(
    bankId: number,
    status: BankVerificationStatus,
    reason?: string,
  ): Promise<UserBank> {
    const bank = await this.userBankRepo.findOne({
      where: { id: bankId },
      relations: { user: true },
    });
    if (!bank) throw new NotFoundException('Bank account not found');

    bank.verificationStatus = status;
    if (status === BankVerificationStatus.VERIFIED) {
      bank.verifiedAt = new Date();
      bank.verificationFailedReason = null;
    } else {
      bank.verificationFailedReason = reason || 'Rejected by administrator';
    }

    const saved = await this.userBankRepo.save(bank);
    const bankMasked = `${bank.bankName} (XX${bank.accountNumber.slice(-4)})`;

    // In-app Notification: BANK_VERIFIED
    await this.notificationService.create(
      bank.user.id,
      NotificationKey.BANK_VERIFIED,
      `Bank account ${status === BankVerificationStatus.VERIFIED ? 'verified' : 'rejected'}`,
      status === BankVerificationStatus.VERIFIED
        ? `${bankMasked} is verified, you can withdraw.`
        : `could not be verified: ${reason || 'Rejected by administrator.'}`,
      { bankId: bank.id, bankMasked, status },
    );

    return saved;
  }

  async deleteBankAccount(userId: number, bankId: number): Promise<{ message: string }> {
    const bank = await this.userBankRepo.findOne({ where: { id: bankId, user: { id: userId } } });
    if (!bank) throw new NotFoundException('Bank account not found');

    // Prevent deletion if bank is linked to any withdrawal requests (preserves audit trail & prevents FK violations)
    const withdrawalCount = await this.userBankRepo.manager.count(Withdrawal, {
      where: { bankId: bank.id },
    });
    if (withdrawalCount > 0) {
      throw new BadRequestException(
        'Cannot delete bank account linked to existing withdrawal records.',
      );
    }

    const bankMasked = `${bank.bankName} (XX${bank.accountNumber.slice(-4)})`;
    await this.userBankRepo.remove(bank);

    // If we deleted the primary, make the oldest remaining one primary
    if (bank.isPrimary) {
      const remainingBanks = await this.userBankRepo.find({ where: { user: { id: userId } }, order: { createdAt: 'ASC' } });
      if (remainingBanks.length > 0) {
        remainingBanks[0].isPrimary = true;
        await this.userBankRepo.save(remainingBanks[0]);
      }
    }

    // In-app Notification: BANK_PRIMARY_CHANGED
    await this.notificationService.create(
      userId,
      NotificationKey.BANK_PRIMARY_CHANGED,
      'Payout bank updated',
      `${bankMasked} was removed.`,
      { bankMasked },
    );

    return { message: 'Bank account deleted successfully' };
  }

  async setPrimaryBankAccount(userId: number, bankId: number): Promise<{ message: string }> {
    const bank = await this.userBankRepo.findOne({ where: { id: bankId, user: { id: userId } } });
    if (!bank) throw new NotFoundException('Bank account not found');

    await this.userBankRepo.update({ user: { id: userId } }, { isPrimary: false });
    bank.isPrimary = true;
    await this.userBankRepo.save(bank);

    const bankMasked = `${bank.bankName} (XX${bank.accountNumber.slice(-4)})`;

    // In-app Notification: BANK_PRIMARY_CHANGED
    await this.notificationService.create(
      userId,
      NotificationKey.BANK_PRIMARY_CHANGED,
      'Payout bank updated',
      `Payouts will now go to ${bankMasked}`,
      { bankId: bank.id, bankMasked },
    );

    return { message: 'Primary bank account updated successfully' };
  }

  async getProfileDetails(userId: number): Promise<UserProfile> {
    const profile = await this.userProfileRepo.findOne({ where: { user: { id: userId } } });
    if (!profile) throw new NotFoundException('Profile details not found');
    return profile;
  }

  async updateProfileDetails(userId: number, dto: UpdateProfileDetailsDto): Promise<UserProfile> {
    const user = await this.findById(userId);
    let profile = await this.userProfileRepo.findOne({ where: { user: { id: userId } } });

    if (!profile) {
      profile = this.userProfileRepo.create({ user, ...dto });
    } else {
      if (dto.dateOfBirth !== undefined) profile.dateOfBirth = dto.dateOfBirth;
      if (dto.gender !== undefined) profile.gender = dto.gender;
      if (dto.addressLine1 !== undefined) profile.addressLine1 = dto.addressLine1;
      if (dto.addressLine2 !== undefined) profile.addressLine2 = dto.addressLine2;
      if (dto.city !== undefined) profile.city = dto.city;
      if (dto.state !== undefined) profile.state = dto.state;
      if (dto.pincode !== undefined) profile.pincode = dto.pincode;
      if (dto.profilePhoto !== undefined) profile.profilePhoto = dto.profilePhoto;
    }

    return this.userProfileRepo.save(profile);
  }
}
