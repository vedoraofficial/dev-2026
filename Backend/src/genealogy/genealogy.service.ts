import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../user/entity/user.entity';
import { UserProfile } from '../user/entity/user-profile.entity';
import { GenealogyNode, PlacementStatus } from './entity/genealogy-node.entity';
import { CommissionUpline } from './entity/commission-upline.entity';
import { JoinPartnerDto } from './dto/join-partner.dto';
import { RegisterPartnerBySponsorDto } from './dto/register-partner-by-sponsor.dto';
import { generateNextVedId } from '../common/utils/ved-id.generator';
import { WalletService } from '../wallet/wallet.service';
import { NotificationService } from '../notification/notification.service';
import { NotificationKey } from '../notification/notification.constants';

@Injectable()
export class GenealogyService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(GenealogyNode)
    private readonly nodeRepo: Repository<GenealogyNode>,
    @InjectRepository(CommissionUpline)
    private readonly uplineRepo: Repository<CommissionUpline>,
    private readonly walletService: WalletService,
    private readonly notificationService: NotificationService,
  ) {}

  async joinPartner(dto: JoinPartnerDto) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const profileRepo = manager.getRepository(UserProfile);
        const nodeRepo = manager.getRepository(GenealogyNode);
        const uplineRepo = manager.getRepository(CommissionUpline);

        // 1. Check for duplicate email or mobile
        const existing = await userRepo.findOne({
          where: [{ email: dto.email }, { mobile: dto.mobile }],
        });
        if (existing) {
          throw new ConflictException('Email or mobile number is already registered.');
        }

        // 2. Validate sponsor by referral VED ID with pessimistic write lock (FOR UPDATE)
        // Queues concurrent registrations under the same sponsor so slots 1..20 are allocated cleanly
        const sponsor = await userRepo
          .createQueryBuilder('user')
          .setLock('pessimistic_write')
          .where('user.ved_id = :vedId', { vedId: dto.referralId })
          .getOne();

        if (!sponsor) {
          throw new NotFoundException(`Sponsor with referral ID ${dto.referralId} does not exist.`);
        }

        if (sponsor.role === UserRole.ADMIN) {
          throw new BadRequestException(
            'Root Admin cannot be a referral sponsor. New partners must register under a Founder or an active Partner.',
          );
        }

        if (sponsor.status === UserStatus.BLOCKED) {
          throw new BadRequestException('Sponsor account is currently blocked.');
        }

        // 3. Verify width constraint (Maximum 20 direct partners per sponsor)
        const existingChildren = await nodeRepo.find({
          where: { parentUserId: sponsor.id },
          select: { slotNumber: true },
        });

        if (existingChildren.length >= 20) {
          throw new BadRequestException(
            `Sponsor ${dto.referralId} has reached the maximum capacity of 20 direct partners.`,
          );
        }

        // Determine next available slot (1 to 20)
        const occupiedSlots = new Set(existingChildren.map((c) => c.slotNumber));
        let availableSlot = 1;
        while (availableSlot <= 20) {
          if (!occupiedSlots.has(availableSlot)) {
            break;
          }
          availableSlot++;
        }

        // 4. Calculate tree depth and uplines based on sponsor type
        let calculatedDepth = 1;
        let uplineLevel1: number | null = sponsor.id;
        let uplineLevel2: number | null = null;
        let uplineLevel3: number | null = null;
        let uplineLevel4: number | null = null;
        let uplineLevel5: number | null = null;

        if (sponsor.role === UserRole.FOUNDER) {
          // Founder is not in the tree and has NO parentId
          // Direct partners under Founder start at Depth 1
          calculatedDepth = 1;
          // Level 1 upline is the Founder, levels 2-5 are null
          uplineLevel1 = sponsor.id;
        } else {
          // Sponsor is a Partner - must have a node in the tree
          const sponsorNode = await nodeRepo.findOne({ where: { userId: sponsor.id } });
          if (!sponsorNode) {
            throw new BadRequestException('Sponsor is not active in the genealogy tree.');
          }
          calculatedDepth = sponsorNode.depth + 1;

          // Fetch sponsor's upline record to shift
          const sponsorUpline = await uplineRepo.findOne({ where: { userId: sponsor.id } });
          uplineLevel1 = sponsor.id;
          uplineLevel2 = sponsorUpline?.level1UserId ?? null;
          uplineLevel3 = sponsorUpline?.level2UserId ?? null;
          uplineLevel4 = sponsorUpline?.level3UserId ?? null;
          uplineLevel5 = sponsorUpline?.level4UserId ?? null;
        }

        // 5. Generate sequential VED ID using database sequence
        const newVedId = await generateNextVedId(manager);

        // 6. Create User record
        const passwordHash = await bcrypt.hash(dto.password, 10);
        const newUser = userRepo.create({
          vedId: newVedId,
          name: dto.name,
          email: dto.email,
          mobile: dto.mobile,
          passwordHash,
          role: UserRole.PARTNER,
          status: UserStatus.PENDING,
        });
        await userRepo.save(newUser);

        // 7. Create UserProfile if profile details provided
        const hasProfileData =
          dto.dateOfBirth ||
          dto.gender ||
          dto.addressLine1 ||
          dto.addressLine2 ||
          dto.city ||
          dto.state ||
          dto.pincode ||
          dto.profilePhoto;

        if (hasProfileData) {
          const userProfile = profileRepo.create({
            user: newUser,
            dateOfBirth: dto.dateOfBirth,
            gender: dto.gender,
            addressLine1: dto.addressLine1,
            addressLine2: dto.addressLine2,
            city: dto.city,
            state: dto.state,
            pincode: dto.pincode,
            profilePhoto: dto.profilePhoto,
          });
          await profileRepo.save(userProfile);
        }

        // 8. Create GenealogyNode for partner
        const newNode = nodeRepo.create({
          userId: newUser.id,
          parentUserId: sponsor.id,
          sponsorUserId: sponsor.id,
          slotNumber: availableSlot,
          depth: calculatedDepth,
          placementStatus: PlacementStatus.ACTIVE,
        });
        await nodeRepo.save(newNode);

        // 9. Save 5-level Commission Uplines
        const newUpline = uplineRepo.create({
          userId: newUser.id,
          level1UserId: uplineLevel1,
          level2UserId: uplineLevel2,
          level3UserId: uplineLevel3,
          level4UserId: uplineLevel4,
          level5UserId: uplineLevel5,
        });
        await uplineRepo.save(newUpline);

        // 10. Create Wallet for the new partner
        await this.walletService.createWallet(newUser.id, manager);

        // In-app Notifications:
        // 1. PARTNER_WELCOME (to new partner)
        await this.notificationService.create(
          newUser.id,
          NotificationKey.PARTNER_WELCOME,
          `Welcome to VEDORA, ${newUser.name}`,
          `Your VEDORA ID is ${newUser.vedId}. You are placed under ${sponsor.name} (${sponsor.vedId}) in slot ${availableSlot}. Sign in at http://localhost:5173/login.`,
          { vedId: newUser.vedId, sponsorVedId: sponsor.vedId, slotNumber: availableSlot },
          manager,
        );

        // 2. TEAM_DIRECT_JOINED (to sponsor)
        const filledSlots = existingChildren.length + 1;
        await this.notificationService.create(
          sponsor.id,
          NotificationKey.TEAM_DIRECT_JOINED,
          `${newUser.name} joined your team`,
          `${newUser.name} (${newUser.vedId}) joined under you in slot ${availableSlot}. ${filledSlots}/20 slots filled.`,
          { newVedId: newUser.vedId, newName: newUser.name, slotNumber: availableSlot, filledSlots },
          manager,
        );

        // 3. TEAM_SLOTS_ALMOST_FULL (if 18) or TEAM_SLOTS_FULL (if 20)
        if (filledSlots === 18) {
          await this.notificationService.create(
            sponsor.id,
            NotificationKey.TEAM_SLOTS_ALMOST_FULL,
            'Only 2 direct slots left',
            'You have filled 18 of your 20 direct slots.',
            { filledSlots: 18 },
            manager,
          );
        } else if (filledSlots === 20) {
          await this.notificationService.create(
            sponsor.id,
            NotificationKey.TEAM_SLOTS_FULL,
            'All 20 direct slots are full',
            'All 20 of your direct slots are filled. New partners can join under your team members.',
            { filledSlots: 20 },
            manager,
          );
        }

        // 4. TEAM_DOWNLINE_JOINED (to level 2-5 uplines)
        const uplines = [
          { id: uplineLevel2, level: 2 },
          { id: uplineLevel3, level: 3 },
          { id: uplineLevel4, level: 4 },
          { id: uplineLevel5, level: 5 },
        ];
        for (const u of uplines) {
          if (u.id) {
            await this.notificationService.create(
              u.id,
              NotificationKey.TEAM_DOWNLINE_JOINED,
              `New partner at Level ${u.level}`,
              `${newUser.name} (${newUser.vedId}) joined your team at Level ${u.level}, under ${sponsor.name}.`,
              { newVedId: newUser.vedId, newName: newUser.name, level: u.level, sponsorName: sponsor.name },
              manager,
            );
          }
        }

        return {
          message: 'Partner successfully joined.',
          partner: {
            id: newUser.id,
            vedId: newUser.vedId,
            name: newUser.name,
            email: newUser.email,
            mobile: newUser.mobile,
            role: newUser.role,
            status: newUser.status,
            slotNumber: availableSlot,
            depth: newNode.depth,
            sponsorVedId: sponsor.vedId,
            sponsorName: sponsor.name,
            sponsorRole: sponsor.role,
          },
        };
      });
    } catch (error: any) {
      if (error?.code === '23505') {
        if (error.detail?.includes('email')) {
          throw new ConflictException('Email is already registered.');
        }
        if (error.detail?.includes('mobile')) {
          throw new ConflictException('Mobile number is already registered.');
        }
        if (error.detail?.includes('parent_user_id') && error.detail?.includes('slot_number')) {
          throw new ConflictException('The target slot was just claimed by another user. Please retry.');
        }
      }
      throw error;
    }
  }

  async getGenealogyByVedId(vedId: string, requester?: { sub: number; role: string }) {
    const user = await this.userRepo.findOne({ where: { vedId } });
    if (!user) throw new NotFoundException(`User with VED ID ${vedId} not found.`);

    // Admin can open anyone; Founders and Partners only themselves or their own downline.
    if (requester && requester.role !== 'ADMIN' && user.id !== requester.sub) {
      const allowed = await this.isInDownline(requester.sub, user.id);
      if (!allowed) throw new ForbiddenException('You can only view your own team.');
    }

    // Direct children (max 20) under this user
    const directChildren = await this.nodeRepo.find({
      where: { parentUserId: user.id },
      relations: { user: true },
      order: { slotNumber: 'ASC' },
    });

    return directChildren.map((child) => ({
      id: child.user.id,
      vedId: child.user.vedId,
      name: child.user.name,
      email: child.user.email,
      mobile: child.user.mobile,
      slotNumber: child.slotNumber,
      depth: child.depth,
      status: child.placementStatus,
    }));
  }

  /** True if `userId` sits anywhere below `ancestorId` (walks parent_user_id upwards). */
  private async isInDownline(
    ancestorId: number,
    userId: number,
    manager?: EntityManager,
  ): Promise<boolean> {
    const rows = await (manager ?? this.dataSource).query(
      `WITH RECURSIVE up AS (
         SELECT user_id, parent_user_id, 1 AS depth FROM genealogy_nodes WHERE user_id = $1
         UNION ALL
         SELECT n.user_id, n.parent_user_id, up.depth + 1
         FROM genealogy_nodes n JOIN up ON n.user_id = up.parent_user_id
         WHERE up.depth < 100
       )
       SELECT 1 FROM up WHERE parent_user_id = $2 LIMIT 1`,
      [userId, ancestorId],
    );
    return rows.length > 0;
  }

  async getMyGenealogy(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');

    // Direct children under this user
    const directChildren = await this.nodeRepo.find({
      where: { parentUserId: user.id },
      relations: { user: true },
      order: { slotNumber: 'ASC' },
    });

    // Node details of logged in user
    const node = await this.nodeRepo.findOne({
      where: { userId: user.id },
      relations: { parentUser: true },
    });

    // 5-level uplines
    const uplines = await this.uplineRepo.findOne({
      where: { userId: user.id },
      relations: {
        level1User: true,
        level2User: true,
        level3User: true,
        level4User: true,
        level5User: true,
      },
    });

    return {
      user: {
        id: user.id,
        vedId: user.vedId,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role,
        status: user.status,
      },
      node: node
        ? {
            depth: node.depth,
            slotNumber: node.slotNumber,
            placementStatus: node.placementStatus,
            parent: node.parentUser
              ? {
                  id: node.parentUser.id,
                  vedId: node.parentUser.vedId,
                  name: node.parentUser.name,
                }
              : null,
          }
        : null,
      directPartnersCount: directChildren.length,
      maxSlots: 20,
      directPartners: directChildren.map((child) => ({
        id: child.user.id,
        vedId: child.user.vedId,
        name: child.user.name,
        email: child.user.email,
        mobile: child.user.mobile,
        slotNumber: child.slotNumber,
        depth: child.depth,
        status: child.placementStatus,
      })),
      commissionUplines: uplines
        ? {
            level1: uplines.level1User
              ? { id: uplines.level1User.id, vedId: uplines.level1User.vedId, name: uplines.level1User.name }
              : null,
            level2: uplines.level2User
              ? { id: uplines.level2User.id, vedId: uplines.level2User.vedId, name: uplines.level2User.name }
              : null,
            level3: uplines.level3User
              ? { id: uplines.level3User.id, vedId: uplines.level3User.vedId, name: uplines.level3User.name }
              : null,
            level4: uplines.level4User
              ? { id: uplines.level4User.id, vedId: uplines.level4User.vedId, name: uplines.level4User.name }
              : null,
            level5: uplines.level5User
              ? { id: uplines.level5User.id, vedId: uplines.level5User.vedId, name: uplines.level5User.name }
              : null,
          }
        : null,
    };
  }

  async registerPartnerBySponsor(sponsorUserId: number, dto: RegisterPartnerBySponsorDto) {
    try {
      return await this.dataSource.transaction(async (manager) => {
        const userRepo = manager.getRepository(User);
        const profileRepo = manager.getRepository(UserProfile);
        const nodeRepo = manager.getRepository(GenealogyNode);
        const uplineRepo = manager.getRepository(CommissionUpline);

        // 1. Verify sponsor with pessimistic write lock (FOR UPDATE)
        // Queues concurrent registrations under this sponsor so manual or auto slots are allocated cleanly
        const sponsor = await userRepo
          .createQueryBuilder('user')
          .setLock('pessimistic_write')
          .where('user.id = :id', { id: sponsorUserId })
          .getOne();

        if (!sponsor) {
          throw new NotFoundException('Sponsor not found.');
        }

        if (sponsor.role === UserRole.ADMIN) {
          throw new BadRequestException('Root Admin cannot directly sponsor partners.');
        }

        if (sponsor.status === UserStatus.BLOCKED) {
          throw new BadRequestException('Your account is currently blocked.');
        }

        // 1b. Placement: under the sponsor, or under someone in the sponsor's own downline.
        // The sponsor stays the sponsor (direct commission); `parent` is where the node sits.
        let parent = sponsor;
        const parentVedId = dto.parentVedId?.trim().toUpperCase();
        if (parentVedId && parentVedId !== sponsor.vedId) {
          const target = await userRepo
            .createQueryBuilder('user')
            .setLock('pessimistic_write')
            .where('user.vedId = :vedId', { vedId: parentVedId })
            .getOne();
          if (!target) {
            throw new NotFoundException(`No partner found with VED ID ${parentVedId}.`);
          }
          if (target.status === UserStatus.BLOCKED) {
            throw new BadRequestException(`${target.name} (${target.vedId}) is blocked.`);
          }
          if (!(await this.isInDownline(sponsor.id, target.id, manager))) {
            throw new ForbiddenException('You can only place partners inside your own team.');
          }
          parent = target;
        }
        const placedUnderYou = parent.id === sponsor.id;

      // 2. Check for duplicate email or mobile
      const existing = await userRepo.findOne({
        where: [{ email: dto.email }, { mobile: dto.mobile }],
      });
      if (existing) {
        throw new ConflictException('Email or mobile number is already registered.');
      }

      // 3. Verify total direct partners capacity (Max 20)
      const existingChildren = await nodeRepo.find({
        where: { parentUserId: parent.id },
        select: { slotNumber: true, userId: true },
      });

      if (existingChildren.length >= 20) {
        throw new BadRequestException(
          placedUnderYou
            ? 'You have reached the maximum capacity of 20 direct partners.'
            : `${parent.name} (${parent.vedId}) has reached the maximum capacity of 20 direct partners.`,
        );
      }

      // 4. Determine slot: manual selection vs auto-allocation
      const occupiedSlots = new Set(existingChildren.map((c) => c.slotNumber));
      let chosenSlot: number;

      if (dto.slotNumber !== undefined && dto.slotNumber !== null) {
        if (dto.slotNumber < 1 || dto.slotNumber > 20) {
          throw new BadRequestException('Slot number must be between 1 and 20.');
        }

        if (occupiedSlots.has(dto.slotNumber)) {
          const conflictNode = existingChildren.find((c) => c.slotNumber === dto.slotNumber);
          const conflictUser = conflictNode ? await userRepo.findOne({ where: { id: conflictNode.userId } }) : null;
          const occupiedByName = conflictUser ? `${conflictUser.name} (${conflictUser.vedId})` : 'another partner';
          throw new BadRequestException(`Slot ${dto.slotNumber} is already occupied by ${occupiedByName}.`);
        }
        chosenSlot = dto.slotNumber;
      } else {
        // Auto-allocate lowest unoccupied slot (1 to 20)
        let slot = 1;
        while (slot <= 20) {
          if (!occupiedSlots.has(slot)) {
            break;
          }
          slot++;
        }
        chosenSlot = slot;
      }

      // 5. Calculate tree depth and 5-level uplines
      // (BV level income follows the tree, so the uplines start from the placement parent.)
      let calculatedDepth = 1;
      let uplineLevel1: number | null = parent.id;
      let uplineLevel2: number | null = null;
      let uplineLevel3: number | null = null;
      let uplineLevel4: number | null = null;
      let uplineLevel5: number | null = null;

      if (parent.role === UserRole.FOUNDER) {
        calculatedDepth = 1;
        uplineLevel1 = parent.id;
      } else {
        const parentNode = await nodeRepo.findOne({ where: { userId: parent.id } });
        if (!parentNode) {
          throw new BadRequestException(
            placedUnderYou
              ? 'Your account is not active in the genealogy tree.'
              : `${parent.name} (${parent.vedId}) is not active in the genealogy tree.`,
          );
        }
        calculatedDepth = parentNode.depth + 1;

        const parentUpline = await uplineRepo.findOne({ where: { userId: parent.id } });
        uplineLevel1 = parent.id;
        uplineLevel2 = parentUpline?.level1UserId ?? null;
        uplineLevel3 = parentUpline?.level2UserId ?? null;
        uplineLevel4 = parentUpline?.level3UserId ?? null;
        uplineLevel5 = parentUpline?.level4UserId ?? null;
      }

      // 6. Generate sequential VED ID using database sequence
      const newVedId = await generateNextVedId(manager);

      // 7. Create User
      const passwordHash = await bcrypt.hash(dto.password, 10);
      const newUser = userRepo.create({
        vedId: newVedId,
        name: dto.name,
        email: dto.email,
        mobile: dto.mobile,
        passwordHash,
        role: UserRole.PARTNER,
        status: UserStatus.PENDING,
      });
      await userRepo.save(newUser);

      // 8. Create UserProfile if profile data provided
      const hasProfileData =
        dto.dateOfBirth ||
        dto.gender ||
        dto.addressLine1 ||
        dto.addressLine2 ||
        dto.city ||
        dto.state ||
        dto.pincode ||
        dto.profilePhoto;

      if (hasProfileData) {
        const userProfile = profileRepo.create({
          user: newUser,
          dateOfBirth: dto.dateOfBirth,
          gender: dto.gender,
          addressLine1: dto.addressLine1,
          addressLine2: dto.addressLine2,
          city: dto.city,
          state: dto.state,
          pincode: dto.pincode,
          profilePhoto: dto.profilePhoto,
        });
        await profileRepo.save(userProfile);
      }

      // 9. Create GenealogyNode
      const newNode = nodeRepo.create({
        userId: newUser.id,
        parentUserId: parent.id,
        sponsorUserId: sponsor.id,
        slotNumber: chosenSlot,
        depth: calculatedDepth,
        placementStatus: PlacementStatus.ACTIVE,
      });
      await nodeRepo.save(newNode);

      // 10. Create CommissionUpline
      const newUpline = uplineRepo.create({
        userId: newUser.id,
        level1UserId: uplineLevel1,
        level2UserId: uplineLevel2,
        level3UserId: uplineLevel3,
        level4UserId: uplineLevel4,
        level5UserId: uplineLevel5,
      });
      await uplineRepo.save(newUpline);

      // 11. Create Wallet for the new partner
      await this.walletService.createWallet(newUser.id, manager);

      // In-app Notifications:
      // 1. PARTNER_WELCOME (to new partner)
      await this.notificationService.create(
        newUser.id,
        NotificationKey.PARTNER_WELCOME,
        `Welcome to VEDORA, ${newUser.name}`,
        `Your VEDORA ID is ${newUser.vedId}. You are placed under ${parent.name} (${parent.vedId}) in slot ${chosenSlot}. Sign in at http://localhost:5173/login.`,
        { vedId: newUser.vedId, sponsorVedId: sponsor.vedId, parentVedId: parent.vedId, slotNumber: chosenSlot },
        manager,
      );

      // 1b. TEAM_DIRECT_JOINED to the placement parent when someone above placed the partner there
      const filledSlots = existingChildren.length + 1;
      if (!placedUnderYou) {
        await this.notificationService.create(
          parent.id,
          NotificationKey.TEAM_DIRECT_JOINED,
          `${newUser.name} joined your team`,
          `${sponsor.name} (${sponsor.vedId}) placed ${newUser.name} (${newUser.vedId}) under you in slot ${chosenSlot}. You now have ${filledSlots} of 20 direct slots filled.`,
          { newVedId: newUser.vedId, newName: newUser.name, slotNumber: chosenSlot, filledSlots },
          manager,
        );
      }

      // 2. TEAM_SLOTS_ALMOST_FULL (if 18) or TEAM_SLOTS_FULL (if 20) — for the placement parent
      if (filledSlots === 18) {
        await this.notificationService.create(
          parent.id,
          NotificationKey.TEAM_SLOTS_ALMOST_FULL,
          'Only 2 direct slots left',
          'You have filled 18 of your 20 direct slots.',
          { filledSlots: 18 },
          manager,
        );
      } else if (filledSlots === 20) {
        await this.notificationService.create(
          parent.id,
          NotificationKey.TEAM_SLOTS_FULL,
          'All 20 direct slots are full',
          'All 20 of your direct slots are filled. New partners can join under your team members.',
          { filledSlots: 20 },
          manager,
        );
      }

      // 3. TEAM_DOWNLINE_JOINED (to level 2-5 uplines)
      const uplines = [
        { id: uplineLevel2, level: 2 },
        { id: uplineLevel3, level: 3 },
        { id: uplineLevel4, level: 4 },
        { id: uplineLevel5, level: 5 },
      ];
      for (const u of uplines) {
        if (u.id) {
          await this.notificationService.create(
            u.id,
            NotificationKey.TEAM_DOWNLINE_JOINED,
            `New partner at Level ${u.level}`,
            `${newUser.name} (${newUser.vedId}) joined your team at Level ${u.level}, under ${parent.name}.`,
            { newVedId: newUser.vedId, newName: newUser.name, level: u.level, sponsorName: parent.name },
            manager,
          );
        }
      }

      return {
        message: `Partner successfully registered into slot ${chosenSlot}.`,
        partner: {
          id: newUser.id,
          vedId: newUser.vedId,
          name: newUser.name,
          email: newUser.email,
          mobile: newUser.mobile,
          role: newUser.role,
          status: newUser.status,
          slotNumber: chosenSlot,
          depth: newNode.depth,
          sponsorVedId: sponsor.vedId,
          sponsorName: sponsor.name,
          placedUnderVedId: parent.vedId,
          placedUnderName: parent.name,
        },
      };
    });
    } catch (error: any) {
      if (error?.code === '23505') {
        if (error.detail?.includes('email')) {
          throw new ConflictException('Email is already registered.');
        }
        if (error.detail?.includes('mobile')) {
          throw new ConflictException('Mobile number is already registered.');
        }
        if (error.detail?.includes('parent_user_id') && error.detail?.includes('slot_number')) {
          throw new ConflictException('The target slot was just claimed by another user. Please retry.');
        }
      }
      throw error;
    }
  }

  async getMySlots(sponsorUserId: number) {
    const sponsor = await this.userRepo.findOne({ where: { id: sponsorUserId } });
    if (!sponsor) throw new NotFoundException('User not found.');

    const directChildren = await this.nodeRepo.find({
      where: { parentUserId: sponsor.id },
      relations: { user: true },
      order: { slotNumber: 'ASC' },
    });

    const slotMap = new Map<number, GenealogyNode>();
    for (const child of directChildren) {
      if (child.slotNumber) {
        slotMap.set(child.slotNumber, child);
      }
    }

    const filledSlots = directChildren.map((child) => ({
      slotNumber: child.slotNumber,
      partner: {
        id: child.user.id,
        vedId: child.user.vedId,
        name: child.user.name,
        email: child.user.email,
        mobile: child.user.mobile,
        status: child.user.status,
        joinedAt: child.createdAt,
      },
    }));

    const slots = [];
    for (let slot = 1; slot <= 20; slot++) {
      slots.push({
        slotNumber: slot,
        isOccupied: slotMap.has(slot),
      });
    }

    return {
      sponsor: {
        id: sponsor.id,
        vedId: sponsor.vedId,
        name: sponsor.name,
        role: sponsor.role,
      },
      totalFilled: directChildren.length,
      totalAvailable: 20 - directChildren.length,
      maxSlots: 20,
      filledSlots,
      slots,
    };
  }
}
