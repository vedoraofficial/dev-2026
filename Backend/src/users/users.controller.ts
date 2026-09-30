import { Controller, Post, Body, Get, Patch, Delete, UseGuards, Request, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/create-user.dto';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('User')
@Controller('user')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User successfully created.' })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.usersService.create(dto);
    return { message: 'User created successfully', vedId: user.vedId };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get()
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  async getProfile(@Request() req: any) {
    // req.user.sub contains the ID extracted from the Bearer token
    return this.usersService.findById(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch()
  @ApiOperation({ summary: 'Update current logged-in user profile' })
  async updateProfile(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.sub, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete()
  @ApiOperation({ summary: 'Delete current logged-in user account' })
  async deleteAccount(@Request() req: any) {
    return this.usersService.delete(req.user.sub);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch('status')
  @ApiOperation({ summary: 'Change user status (Active/Inactive/Blocked)' })
  async changeStatus(@Request() req: any, @Body() dto: UpdateUserStatusDto) {
    // In a real app, you might restrict this to Admins only
    return this.usersService.changeStatus(req.user.sub, dto);
  }
}
