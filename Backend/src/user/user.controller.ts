import { Controller, Post, Body, Get, Patch, Delete, UseGuards, Request, Param, ParseIntPipe, BadRequestException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AddBankDetailsDto } from './dto/bank-details.dto';
import { UpdateProfileDetailsDto } from './dto/profile-details.dto';
import { AdminVerifyBankDto } from './dto/admin-verify-bank.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { RateLimit, RateLimitGuard } from '../common/guards/rate-limit.guard';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ─── Admin-Only Endpoints ───────────────────────────────────────────

  @Post()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Create a new user directly' })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.userService.create(dto);
    return { message: 'User created successfully', vedId: user.vedId };
  }

  @Patch(':id/status')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Change user status by ID (Pending/Active/Inactive/Blocked)' })
  async changeStatusById(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserStatusDto,
  ) {
    return this.userService.changeStatus(id, dto);
  }

  @Patch('status')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Change user status by userId in request body' })
  async changeStatus(@Request() req: any, @Body() dto: UpdateUserStatusDto) {
    if (!dto.userId) {
      throw new BadRequestException('userId is required in the request body.');
    }
    return this.userService.changeStatus(dto.userId, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Delete a user account by ID' })
  async deleteAccountById(@Param('id', ParseIntPipe) id: number, @Request() req: any) {
    if (id === req.user.sub) {
      throw new BadRequestException('Administrators cannot delete their own account.');
    }
    return this.userService.delete(id);
  }

  @Delete()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Delete a user account' })
  async deleteAccount(@Request() _req: any) {
    throw new BadRequestException('Must specify user ID to delete (e.g. DELETE /api/user/:id).');
  }

  @Patch('admin/bank/:id/verify')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Manually verify or reject a user bank account' })
  async adminVerifyBank(
    @Param('id', ParseIntPipe) bankId: number,
    @Body() dto: AdminVerifyBankDto,
  ) {
    return this.userService.adminVerifyBankAccount(bankId, dto.status, dto.reason);
  }

  // ─── Self-Service Endpoints (Any Authenticated User) ────────────────

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  async getProfile(@Request() req: any) {
    return this.userService.findById(req.user.sub);
  }

  @Patch()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update current logged-in user profile (Password excluded)' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.userService.update(req.user.sub, dto);
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 5, message: 'Too many password change attempts. Please wait 1 minute.' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(req.user.sub, dto);
  }

  // ─── Bank Account Management (Self) ─────────────────────────────────

  @Get('bank')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all bank accounts for current user' })
  async getBankAccounts(@Request() req: any) {
    return this.userService.getBankAccounts(req.user.sub);
  }

  @Post('bank')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 10, message: 'Too many bank account addition requests. Please try again later.' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add a new bank account' })
  async addBankAccount(@Request() req: any, @Body() dto: AddBankDetailsDto) {
    return this.userService.addBankAccount(req.user.sub, dto);
  }

  @Post('bank/:id/verify')
  @UseGuards(JwtAuthGuard, RateLimitGuard)
  @RateLimit({ windowMs: 60000, max: 5, message: 'Too many bank verification attempts. Please wait a minute before retrying.' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Trigger Penny Drop verification for an existing bank account' })
  async verifyBank(@Request() req: any, @Param('id', ParseIntPipe) bankId: number) {
    return this.userService.verifyExistingBankAccount(req.user.sub, bankId);
  }

  @Patch('bank/:id/primary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Set a specific bank account as primary' })
  async setPrimaryBank(@Request() req: any, @Param('id', ParseIntPipe) bankId: number) {
    return this.userService.setPrimaryBankAccount(req.user.sub, bankId);
  }

  @Delete('bank/:id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a specific bank account' })
  async deleteBank(@Request() req: any, @Param('id', ParseIntPipe) bankId: number) {
    return this.userService.deleteBankAccount(req.user.sub, bankId);
  }

  // ─── Profile Details (Self) ─────────────────────────────────────────

  @Get('profile-details')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user extended profile details' })
  async getProfileDetails(@Request() req: any) {
    return this.userService.getProfileDetails(req.user.sub);
  }

  @Patch('profile-details')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add or update current user extended profile details' })
  async updateProfileDetails(@Request() req: any, @Body() dto: UpdateProfileDetailsDto) {
    return this.userService.updateProfileDetails(req.user.sub, dto);
  }
}
