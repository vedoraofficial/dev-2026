import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from './entity/user.entity';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.userRepo.findOne({
      where: [{ email: dto.email }, { mobile: dto.mobile }],
    });

    if (existing) {
      throw new ConflictException('Email or mobile already in use');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const vedId = `VED${Math.floor(Math.random() * 90000) + 10000}`;

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
}
