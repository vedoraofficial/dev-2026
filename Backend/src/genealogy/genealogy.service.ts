import { Injectable, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserStatus } from '../user/entity/user.entity';
import { UserProfile } from '../user/entity/user-profile.entity';
import { GenealogyNode, PlacementStatus } from './entity/genealogy-node.entity';
import { CommissionUpline } from './entity/commission-upline.entity';
import { JoinPartnerDto } from './dto/join-partner.dto';

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
  ) {}

  async joinPartner(dto: JoinPartnerDto) {
    return this.dataSource.transaction(async (manager) => {
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

      // 2. Validate sponsor by referral VED ID
      const sponsor = await userRepo.findOne({ where: { vedId: dto.referralId } });
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

      // 5. Generate unique VED ID for new partner
      let newVedId = '';
      let isUnique = false;
      while (!isUnique) {
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        newVedId = `VED${randomNum}`;
        const collision = await userRepo.findOne({ where: { vedId: newVedId } });
        if (!collision) isUnique = true;
      }

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
  }

  async getGenealogyByVedId(vedId: string) {
    const user = await this.userRepo.findOne({ where: { vedId } });
    if (!user) throw new NotFoundException(`User with VED ID ${vedId} not found.`);

    // Direct children (max 20) under this user
    const directChildren = await this.nodeRepo.find({
      where: { parentUserId: user.id },
      relations: { user: true },
      order: { slotNumber: 'ASC' },
    });

    // Check if user has their own node
    const node = await this.nodeRepo.findOne({
      where: { userId: user.id },
      relations: { parentUser: true },
    });

    // 5-level uplines (only partners have this)
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
      isFounder: user.role === UserRole.FOUNDER,
      isAdmin: user.role === UserRole.ADMIN,
      directPartnersCount: directChildren.length,
      maxSlots: 20,
      directPartners: directChildren.map((child) => ({
        id: child.user.id,
        vedId: child.user.vedId,
        name: child.user.name,
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

  async getMyGenealogy(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found.');
    return this.getGenealogyByVedId(user.vedId);
  }
}
