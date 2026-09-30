import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from './entity/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AddBankDetailsDto } from './dto/bank-details.dto';
import { UpdateProfileDetailsDto } from './dto/profile-details.dto';
import { UserBank } from './entity/user-bank.entity';
import { UserProfile } from './entity/user-profile.entity';
import { generateNextVedId } from '../common/utils/ved-id.generator';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(UserBank)
    private readonly userBankRepo: Repository<UserBank>,
    @InjectRepository(UserProfile)
    private readonly userProfileRepo: Repository<UserProfile>,
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

    return this.userRepo.save(user);
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

    if (dto.name) user.name = dto.name;
    if (dto.email) user.email = dto.email;
    if (dto.mobile) user.mobile = dto.mobile;

    return this.userRepo.save(user);
  }

  async changePassword(id: number, dto: ChangePasswordDto): Promise<{ success: boolean; message: string }> {
    const user = await this.findById(id);

    const passwordValid = await bcrypt.compare(dto.oldPassword, user.passwordHash);
    if (!passwordValid) {
      return { success: false, message: 'old password didnt match' };
    }

    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.userRepo.save(user);
    
    return { success: true, message: 'successfully changed' };
  }

  async save(user: User): Promise<User> {
    return this.userRepo.save(user);
  }

  async delete(id: number): Promise<{ message: string }> {
    const user = await this.findById(id);
    await this.userRepo.remove(user);
    return { message: 'User deleted successfully' };
  }

  async changeStatus(id: number, dto: UpdateUserStatusDto): Promise<User> {
    const user = await this.findById(id);
    user.status = dto.status;
    return this.userRepo.save(user);
  }

  async getBankAccounts(userId: number): Promise<UserBank[]> {
    return this.userBankRepo.find({ where: { user: { id: userId } }, order: { isPrimary: 'DESC', createdAt: 'DESC' } });
  }

  async addBankAccount(userId: number, dto: AddBankDetailsDto): Promise<UserBank> {
    const user = await this.findById(userId);
    const existingBanks = await this.userBankRepo.find({ where: { user: { id: userId } } });

    // If it's the first bank, force it to be primary regardless of what they passed
    let isPrimary = existingBanks.length === 0 ? true : (dto.isPrimary || false);

    // If they are setting this new one as primary, downgrade all others
    if (isPrimary && existingBanks.length > 0) {
      await this.userBankRepo.update({ user: { id: userId } }, { isPrimary: false });
    }

    const newBank = this.userBankRepo.create({
      user,
      accountHolderName: dto.accountHolderName,
      accountNumber: dto.accountNumber,
      bankName: dto.bankName,
      ifscCode: dto.ifscCode,
      isPrimary,
    });

    return this.userBankRepo.save(newBank);
  }

  async deleteBankAccount(userId: number, bankId: number): Promise<{ message: string }> {
    const bank = await this.userBankRepo.findOne({ where: { id: bankId, user: { id: userId } } });
    if (!bank) throw new NotFoundException('Bank account not found');

    await this.userBankRepo.remove(bank);

    // If we deleted the primary, make the oldest remaining one primary
    if (bank.isPrimary) {
      const remainingBanks = await this.userBankRepo.find({ where: { user: { id: userId } }, order: { createdAt: 'ASC' } });
      if (remainingBanks.length > 0) {
        remainingBanks[0].isPrimary = true;
        await this.userBankRepo.save(remainingBanks[0]);
      }
    }

    return { message: 'Bank account deleted successfully' };
  }

  async setPrimaryBankAccount(userId: number, bankId: number): Promise<{ message: string }> {
    const bank = await this.userBankRepo.findOne({ where: { id: bankId, user: { id: userId } } });
    if (!bank) throw new NotFoundException('Bank account not found');

    await this.userBankRepo.update({ user: { id: userId } }, { isPrimary: false });
    bank.isPrimary = true;
    await this.userBankRepo.save(bank);

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
