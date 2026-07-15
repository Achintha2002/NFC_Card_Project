// ============================================================
//  TAGIT — Prisma Seed Script
//  Run: npm run db:seed (from packages/backend)
//  Creates a demo user + profile + links for local development.
// ============================================================

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding TAGIT database...');

  // ── Cleanup previous seed data ──────────────────────────────
  await prisma.verificationRequest.deleteMany();
  await prisma.linkClickAnalytics.deleteMany();
  await prisma.tapAnalytics.deleteMany();
  await prisma.link.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();

  // ── Create demo user ────────────────────────────────────────
  const passwordHash = await bcrypt.hash('tagit-demo-2024', 12);

  const user = await prisma.user.create({
    data: {
      email: 'demo@tagit.cards',
      passwordHash,
      subscriptionTier: "PREMIUM",
      profile: {
        create: {
          username: 'alexmorgan',
          displayName: 'Alex Morgan',
          bio: 'Product Designer & Creative Director. Crafting digital experiences that leave a mark.',
          phone: '+1 (555) 012-3456',
          email: 'alex@tagit.cards',
          company: 'TAGIT Creative Studio',
          jobTitle: 'Creative Director',
          website: 'https://alexmorgan.design',
          profilePicture: null, // Will be set after image upload in production
          companyLogo: null,
          tapCount: 142,
          links: {
            createMany: {
              data: [
                {
                  platform: "LINKEDIN",
                  url: 'https://linkedin.com/in/alexmorgan',
                  label: 'LinkedIn',
                  sortOrder: 0,
                  isActive: true,
                },
                {
                  platform: "GITHUB",
                  url: 'https://github.com/alexmorgan',
                  label: 'GitHub',
                  sortOrder: 1,
                  isActive: true,
                },
                {
                  platform: "INSTAGRAM",
                  url: 'https://instagram.com/alexmorgan.design',
                  label: 'Instagram',
                  sortOrder: 2,
                  isActive: true,
                },
                {
                  platform: "WHATSAPP",
                  url: 'https://wa.me/15550123456',
                  label: 'WhatsApp',
                  sortOrder: 3,
                  isActive: false, // Demo of inactive link
                },
                {
                  platform: "WEBSITE",
                  url: 'https://alexmorgan.design/portfolio',
                  label: 'Portfolio',
                  sortOrder: 4,
                  isActive: true,
                },
              ],
            },
          },
        },
      },
    },
    include: {
      profile: {
        include: { links: true },
      },
    },
  });

  console.log('✅ Demo user created:', user.email);
  console.log('✅ Profile username:', user.profile?.username);
  console.log('✅ Links created:', user.profile?.links.length);

  // ── Seed mock TapAnalytics & LinkClickAnalytics ─────────────
  if (user.profile) {
    const profileId = user.profile.id;
    const links = user.profile.links;
    const now = new Date();

    const devices = ["Mobile", "Mobile", "Mobile", "Desktop", "Tablet"];
    const browsers = ["Safari", "Chrome", "Chrome", "Firefox", "Safari"];
    const osList = ["iOS", "Android", "iOS", "macOS", "iPadOS"];
    const locations = [
      { location: "Colombo, LK", country: "LK", city: "Colombo" },
      { location: "New York, US", country: "US", city: "New York" },
      { location: "London, UK", country: "UK", city: "London" },
      { location: "Tokyo, JP", country: "JP", city: "Tokyo" },
      { location: "Sydney, AU", country: "AU", city: "Sydney" },
    ];

    const tapRecords = [];
    for (let i = 0; i < 45; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const hoursAgo = Math.floor(Math.random() * 24);
      const timestamp = new Date(now.getTime() - (daysAgo * 24 * 60 + hoursAgo * 60) * 60 * 1000);
      const loc = locations[i % locations.length];
      const deviceIdx = i % devices.length;

      tapRecords.push({
        profileId,
        timestamp,
        ipAddress: `192.168.1.${10 + i}`,
        userAgent: `${devices[deviceIdx]} (${osList[deviceIdx]}; ${browsers[deviceIdx]})`,
        device: devices[deviceIdx],
        browser: browsers[deviceIdx],
        os: osList[deviceIdx],
        location: loc.location,
        country: loc.country,
        city: loc.city,
      });
    }
    await prisma.tapAnalytics.createMany({ data: tapRecords });
    console.log('✅ Seeded mock TapAnalytics records:', tapRecords.length);

    if (links.length > 0) {
      const clickRecords = [];
      for (const link of links) {
        const clicksCount = Math.floor(Math.random() * 12) + 4;
        await prisma.link.update({
          where: { id: link.id },
          data: { clickCount: clicksCount },
        });

        for (let j = 0; j < clicksCount; j++) {
          const daysAgo = Math.floor(Math.random() * 30);
          const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
          const loc = locations[j % locations.length];
          const deviceIdx = j % devices.length;

          clickRecords.push({
            profileId,
            linkId: link.id,
            timestamp,
            ipAddress: `192.168.1.${50 + j}`,
            userAgent: `${devices[deviceIdx]} (${osList[deviceIdx]}; ${browsers[deviceIdx]})`,
            device: devices[deviceIdx],
            browser: browsers[deviceIdx],
            os: osList[deviceIdx],
            location: loc.location,
            country: loc.country,
            city: loc.city,
          });
        }
      }
      await prisma.linkClickAnalytics.createMany({ data: clickRecords });
      console.log('✅ Seeded mock LinkClickAnalytics records:', clickRecords.length);
    }
  }

  // ── Create Super Admin user ─────────────────────────────────
  const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 12);
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@tagit.com',
      passwordHash: adminPasswordHash,
      role: 'SUPER_ADMIN',
      subscriptionTier: 'CORPORATE',
      profiles: {
        create: [
          {
            username: 'tagit_admin',
            displayName: 'TAGIT Executive Administrator',
            bio: 'Official System Super Administrator for TAGIT ERP.',
            isDefault: true,
          },
        ],
      },
    },
  });
  console.log('✅ Super Admin created:', adminUser.email);

  console.log('\n🎉 Seed complete! Visit: http://localhost:3000/p/alexmorgan');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
