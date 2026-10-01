import { AppDataSource } from '../config/data-source';
import { User, UserRole, UserStatus } from '../user/entity/user.entity';
import { GenealogyNode } from '../genealogy/entity/genealogy-node.entity';
import { CommissionUpline } from '../genealogy/entity/commission-upline.entity';
import { Wallet } from '../wallet/entity/wallet.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  await AppDataSource.initialize();
  console.log('🌱 Database connection initialized.');

  const userRepo = AppDataSource.getRepository(User);
  const nodeRepo = AppDataSource.getRepository(GenealogyNode);
  const uplineRepo = AppDataSource.getRepository(CommissionUpline);

  // 1. Seed or retrieve Root Admin (VED108)
  let rootAdmin = await userRepo.findOne({ where: { vedId: 'VED108' } });

  if (!rootAdmin) {
    console.log('⚙️  Creating default Root Admin (VED108)...');
    const passwordHash = await bcrypt.hash('root@123', 10);

    rootAdmin = userRepo.create({
      vedId: 'VED108',
      name: 'Root Admin',
      email: 'admin@vedora.com',
      mobile: '0000000000',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });
    await userRepo.save(rootAdmin);
    console.log('✅ Root Admin created.');
  } else {
    console.log('⏭️  Root Admin (VED108) already exists.');
  }

  // 2. Fixed Permanent Founders: VED000001, VED000002, VED000003
  const foundersData = [
    { vedId: 'VED000001', name: 'Founder One', email: 'founder1@vedora.com', mobile: '1111110001' },
    { vedId: 'VED000002', name: 'Founder Two', email: 'founder2@vedora.com', mobile: '1111110002' },
    { vedId: 'VED000003', name: 'Founder Three', email: 'founder3@vedora.com', mobile: '1111110003' },
  ];

  const defaultFounderPassword = await bcrypt.hash('founder@123', 10);
  const founderIds: number[] = [];

  for (const founderInfo of foundersData) {
    let founder = await userRepo.findOne({ where: { vedId: founderInfo.vedId } });

    if (!founder) {
      console.log(`⚙️  Creating fixed Founder (${founderInfo.vedId})...`);
      founder = userRepo.create({
        vedId: founderInfo.vedId,
        name: founderInfo.name,
        email: founderInfo.email,
        mobile: founderInfo.mobile,
        passwordHash: defaultFounderPassword,
        role: UserRole.FOUNDER,
        status: UserStatus.ACTIVE,
      });
      await userRepo.save(founder);
      console.log(`✅ Founder ${founderInfo.vedId} created.`);
    } else {
      console.log(`⏭️  Founder ${founderInfo.vedId} already exists.`);
    }
    founderIds.push(founder.id);
  }

  // Ensure neither Root Admin nor Founders are in the genealogy tree or uplines
  const excludeUserIds = [rootAdmin.id, ...founderIds];
  for (const userId of excludeUserIds) {
    await nodeRepo.delete({ userId });
    await uplineRepo.delete({ userId });
  }

  console.log('🎉 Root Admin and Fixed Founders verified (NOT in genealogy tree).');

  // 3. Ensure wallets exist for Root Admin and all Founders
  const walletRepo = AppDataSource.getRepository(Wallet);
  const allUserIds = [rootAdmin.id, ...founderIds];

  for (const userId of allUserIds) {
    const existingWallet = await walletRepo.findOne({ where: { userId } });
    if (!existingWallet) {
      const wallet = walletRepo.create({ userId });
      await walletRepo.save(wallet);
      console.log(`💰 Wallet created for user ID ${userId}.`);
    } else {
      console.log(`⏭️  Wallet already exists for user ID ${userId}.`);
    }
  }

  console.log('💰 All wallets verified.');

  await AppDataSource.destroy();
  console.log('🔌 Database connection closed.');
}

seed().catch((error) => {
  console.error('❌ Error during seeding:', error);
  process.exit(1);
});
