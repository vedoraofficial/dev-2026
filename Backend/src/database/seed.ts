import { AppDataSource } from '../config/data-source';
import { User, UserRole, UserStatus } from '../users/user.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  // Initialize the database connection
  await AppDataSource.initialize();
  console.log('🌱 Database connection initialized.');

  const userRepo = AppDataSource.getRepository(User);

  // Check if Root Admin already exists
  const existingAdmin = await userRepo.findOne({ where: { vedId: 'VED108' } });

  if (!existingAdmin) {
    console.log('⚙️  Creating default Root Admin (VED108)...');
    
    const passwordHash = await bcrypt.hash('root@123', 10);

    const rootAdmin = userRepo.create({
      vedId: 'VED108',
      name: 'Root Admin',
      email: 'admin@vedora.com',
      mobile: '0000000000',
      passwordHash,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
    });

    await userRepo.save(rootAdmin);
    console.log('✅ Root Admin created successfully!');
  } else {
    console.log('⏭️  Root Admin (VED108) already exists. Skipping.');
  }

  // Close connection
  await AppDataSource.destroy();
  console.log('🔌 Database connection closed.');
}

seed().catch((error) => {
  console.error('❌ Error during seeding:', error);
  process.exit(1);
});
