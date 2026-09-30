import { Controller, Post, Body, Get, Patch, Delete, UseGuards, Request, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { UserService } from './user.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AddBankDetailsDto } from './dto/bank-details.dto';
import { UpdateProfileDetailsDto } from './dto/profile-details.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.userService.create(dto);
    return { message: 'User created successfully', vedId: user.vedId };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  async getProfile(@Request() req: any) {
    return this.userService.findById(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch()
  @ApiOperation({ summary: 'Update current logged-in user profile (Password excluded)' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.userService.update(req.user.sub, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('password')
  @ApiOperation({ summary: 'Change current user password' })
  async changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.userService.changePassword(req.user.sub, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete()
  @ApiOperation({ summary: 'Delete current logged-in user account' })
  async deleteAccount(@Request() req: any) {
    return this.userService.delete(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('status')
  @ApiOperation({ summary: 'Change user status (Pending/Active/Inactive/Blocked)' })
  async changeStatus(@Request() req: any, @Body() dto: UpdateUserStatusDto) {
    return this.userService.changeStatus(req.user.sub, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('bank')
  @ApiOperation({ summary: 'Get all bank accounts for current user' })
  async getBankAccounts(@Request() req: any) {
    return this.userService.getBankAccounts(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post('bank')
  @ApiOperation({ summary: 'Add a new bank account' })
  async addBankAccount(@Request() req: any, @Body() dto: AddBankDetailsDto) {
    return this.userService.addBankAccount(req.user.sub, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('bank/:id/primary')
  @ApiOperation({ summary: 'Set a specific bank account as primary' })
  async setPrimaryBank(@Request() req: any, @Param('id') bankId: number) {
    return this.userService.setPrimaryBankAccount(req.user.sub, bankId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete('bank/:id')
  @ApiOperation({ summary: 'Delete a specific bank account' })
  async deleteBank(@Request() req: any, @Param('id') bankId: number) {
    return this.userService.deleteBankAccount(req.user.sub, bankId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('profile-details')
  @ApiOperation({ summary: 'Get current user extended profile details' })
  async getProfileDetails(@Request() req: any) {
    return this.userService.getProfileDetails(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('profile-details')
  @ApiOperation({ summary: 'Add or update current user extended profile details' })
  async updateProfileDetails(@Request() req: any, @Body() dto: UpdateProfileDetailsDto) {
    return this.userService.updateProfileDetails(req.user.sub, dto);
  }
}
