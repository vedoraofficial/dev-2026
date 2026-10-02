import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository, EntityManager } from 'typeorm';
import { Notification } from './entity/notification.entity';
import { User, UserRole } from '../user/entity/user.entity';
import { GenealogyNode } from '../genealogy/entity/genealogy-node.entity';
import { CommissionUpline } from '../genealogy/entity/commission-upline.entity';
import { NotificationKey } from './notification.constants';
import { GetNotificationsQueryDto } from './dto/get-notifications-query.dto';
import { AnnouncementTarget, CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(GenealogyNode)
    private readonly nodeRepo: Repository<GenealogyNode>,
    @InjectRepository(CommissionUpline)
    private readonly uplineRepo: Repository<CommissionUpline>,
  ) {}

  /**
   * Create an in-app notification for a specific user
   */
  async create(
    userId: number,
    key: NotificationKey | string,
    title: string,
    message: string,
    metadata?: Record<string, any> | null,
    manager?: EntityManager,
  ): Promise<Notification> {
    try {
      const repo = manager ? manager.getRepository(Notification) : this.notificationRepo;
      const notification = repo.create({
        userId,
        key,
        title,
        message,
        metadata: metadata || null,
        isRead: false,
      });

      const saved = await repo.save(notification);
      this.logger.debug(`[In-App Notification] Sent to User ID ${userId}: "${title}" [${key}]`);
      return saved;
    } catch (error: any) {
      this.logger.error(`Failed to create notification for User ID ${userId} [${key}]:`, error);
      throw error;
    }
  }

  /**
   * Send notification to all Administrators
   */
  async notifyAllAdmins(
    key: NotificationKey | string,
    title: string,
    message: string,
    metadata?: Record<string, any> | null,
    manager?: EntityManager,
  ): Promise<void> {
    try {
      const userRepo = manager ? manager.getRepository(User) : this.userRepo;
      const notifRepo = manager ? manager.getRepository(Notification) : this.notificationRepo;

      const admins = await userRepo.find({
        where: { role: UserRole.ADMIN },
        select: { id: true },
      });

      if (!admins.length) return;

      const notifications = admins.map((admin) =>
        notifRepo.create({
          userId: admin.id,
          key,
          title,
          message,
          metadata: metadata || null,
          isRead: false,
        }),
      );

      await notifRepo.save(notifications);
      this.logger.log(`[In-App Notification] Broadcasted to ${admins.length} Admins: "${title}" [${key}]`);
    } catch (error: any) {
      this.logger.error(`Failed to notify admins for key [${key}]:`, error);
    }
  }

  /**
   * Send notification to all Partners & Founders
   */
  async notifyAllPartners(
    key: NotificationKey | string,
    title: string,
    message: string,
    metadata?: Record<string, any> | null,
    manager?: EntityManager,
  ): Promise<number> {
    try {
      const userRepo = manager ? manager.getRepository(User) : this.userRepo;
      const notifRepo = manager ? manager.getRepository(Notification) : this.notificationRepo;

      const partners = await userRepo.find({
        where: { role: In([UserRole.PARTNER, UserRole.FOUNDER]) },
        select: { id: true },
      });

      if (!partners.length) return 0;

      const notifications = partners.map((p) =>
        notifRepo.create({
          userId: p.id,
          key,
          title,
          message,
          metadata: metadata || null,
          isRead: false,
        }),
      );

      // Save in batches of 500 to keep queries efficient
      const chunkSize = 500;
      for (let i = 0; i < notifications.length; i += chunkSize) {
        await notifRepo.save(notifications.slice(i, i + chunkSize));
      }

      this.logger.log(`[In-App Notification] Broadcasted to ${partners.length} Partners: "${title}" [${key}]`);
      return partners.length;
    } catch (error: any) {
      this.logger.error(`Failed to notify all partners for key [${key}]:`, error);
      return 0;
    }
  }

  /**
   * Send notification to all members of a Founder's team
   */
  async notifyTeam(
    founderUserId: number,
    key: NotificationKey | string,
    title: string,
    message: string,
    metadata?: Record<string, any> | null,
  ): Promise<number> {
    try {
      // Find all partners who have this founder in their 5 uplines or as direct parent
      const uplineMatches = await this.uplineRepo.find({
        where: [
          { level1UserId: founderUserId },
          { level2UserId: founderUserId },
          { level3UserId: founderUserId },
          { level4UserId: founderUserId },
          { level5UserId: founderUserId },
        ],
        select: { userId: true },
      });

      const userIds = new Set<number>(uplineMatches.map((u) => u.userId));
      userIds.add(founderUserId); // Include the founder as well

      if (userIds.size === 0) return 0;

      const notifications = Array.from(userIds).map((uid) =>
        this.notificationRepo.create({
          userId: uid,
          key,
          title,
          message,
          metadata: metadata || null,
          isRead: false,
        }),
      );

      await this.notificationRepo.save(notifications);
      this.logger.log(`[In-App Notification] Sent to ${userIds.size} team members under Founder ID ${founderUserId}`);
      return userIds.size;
    } catch (error: any) {
      this.logger.error(`Failed to notify team under founder ${founderUserId}:`, error);
      return 0;
    }
  }

  /**
   * Get paginated notifications for the logged in user
   */
  async getUserNotifications(userId: number, query: GetNotificationsQueryDto) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId };
    if (query.unreadOnly) {
      where.isRead = false;
    }

    const [items, total] = await this.notificationRepo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });

    const unreadCount = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });

    return {
      items,
      total,
      unreadCount,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get unread notifications count for badge display
   */
  async getUnreadCount(userId: number): Promise<{ unreadCount: number }> {
    const unreadCount = await this.notificationRepo.count({
      where: { userId, isRead: false },
    });
    return { unreadCount };
  }

  /**
   * Mark a specific notification as read
   */
  async markAsRead(userId: number, notificationId: number): Promise<Notification> {
    const notification = await this.notificationRepo.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.isRead) {
      notification.isRead = true;
      notification.readAt = new Date();
      await this.notificationRepo.save(notification);
    }

    return notification;
  }

  /**
   * Mark all notifications as read for current user
   */
  async markAllAsRead(userId: number): Promise<{ success: boolean; count: number }> {
    const result = await this.notificationRepo.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );

    return {
      success: true,
      count: result.affected || 0,
    };
  }

  /**
   * Broadcast announcement (Admin only)
   */
  async sendAnnouncement(
    adminUserId: number,
    dto: CreateAnnouncementDto,
  ): Promise<{ success: boolean; message: string; recipientCount: number }> {
    let recipientCount = 0;

    if (dto.target === AnnouncementTarget.FOUNDER_TEAM) {
      if (!dto.founderVedId) {
        throw new BadRequestException('founderVedId is required when target is FOUNDER_TEAM');
      }

      const founder = await this.userRepo.findOne({
        where: { vedId: dto.founderVedId },
      });

      if (!founder) {
        throw new NotFoundException(`Founder with VED ID "${dto.founderVedId}" not found`);
      }

      recipientCount = await this.notifyTeam(
        founder.id,
        NotificationKey.ANNOUNCEMENT,
        dto.title,
        dto.message,
        { announcedByAdminId: adminUserId, founderVedId: dto.founderVedId },
      );
    } else {
      recipientCount = await this.notifyAllPartners(
        NotificationKey.ANNOUNCEMENT,
        dto.title,
        dto.message,
        { announcedByAdminId: adminUserId },
      );
    }

    return {
      success: true,
      message: 'Announcement broadcasted successfully',
      recipientCount,
    };
  }
}
