import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { UserRole, SubscriptionTier } from '@prisma/client';

async function seedAdmin() {
  console.log('⚡ Seeding TAGIT Super Admin Account...');

  const adminEmail = 'admin@tagit.com';
  const adminPassword = 'AdminPassword123!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: { profiles: true },
  });

  if (existingAdmin) {
    const updated = await prisma.user.update({
      where: { email: adminEmail },
      data: {
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        subscriptionTier: SubscriptionTier.CORPORATE,
      },
      include: { profiles: true },
    });
    console.log(`✅ Updated existing Super Admin account: ${updated.email} (${updated.role})`);
  } else {
    const created = await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: UserRole.SUPER_ADMIN,
        subscriptionTier: SubscriptionTier.CORPORATE,
        authProvider: 'EMAIL',
        profiles: {
          create: {
            username: 'tagit_admin',
            displayName: 'TAGIT Executive Administrator',
            bio: 'Official System Super Administrator for TAGIT ERP.',
          },
        },
      },
      include: { profiles: true },
    });
    console.log(`✅ Created new Super Admin account: ${created.email} (${created.role})`);
  }

  // Also check if there are any other users in DB
  const allUsers = await prisma.user.findMany({
    select: { id: true, email: true, role: true, authProvider: true },
  });

  console.log('\n📋 Current Database Users:');
  allUsers.forEach((u) => {
    console.log(` - [${u.role}] ${u.email} (Provider: ${u.authProvider})`);
  });

  await prisma.$disconnect();
}

seedAdmin().catch((err) => {
  console.error('Failed to seed admin:', err);
  process.exit(1);
});
