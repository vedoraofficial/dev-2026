import {
  Controller,
  Get,
  Patch,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get paginated list of notifications for the logged-in user' })
  @ApiResponse({ status: 200, description: 'List of notifications with unread count.' })
  async getNotifications(
    @Request() req: any,
    @Query() query: GetNotificationsQueryDto,
  ) {
    return this.notificationService.getUserNotifications(req.user.sub, query);
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get total unread notifications count for header badge' })
  @ApiResponse({ status: 200, description: 'Current unread notifications count.' })
  async getUnreadCount(@Request() req: any) {
    return this.notificationService.getUnreadCount(req.user.sub);
  }

  @Patch('read-all')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all unread notifications as read for current user' })
  @ApiResponse({ status: 200, description: 'All notifications marked as read.' })
  async markAllAsRead(@Request() req: any) {
    return this.notificationService.markAllAsRead(req.user.sub);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a specific notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read.' })
  async markAsRead(
    @Request() req: any,
    @Param('id', ParseIntPipe) notificationId: number,
  ) {
    const notification = await this.notificationService.markAsRead(req.user.sub, notificationId);
    return { success: true, notification };
  }

  @Post('announcement')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Broadcast an announcement notification to all partners or a founder team' })
  @ApiResponse({ status: 201, description: 'Announcement broadcasted successfully.' })
  async sendAnnouncement(
    @Request() req: any,
    @Body() dto: CreateAnnouncementDto,
  ) {
    return this.notificationService.sendAnnouncement(req.user.sub, dto);
  }
}
