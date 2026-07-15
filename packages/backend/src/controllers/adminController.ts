// ============================================================
//  TAGIT — Admin Controller
//  Handles Executive Analytics, NFC Inventory, Card Provisioning,
//  Order Fulfillment, Customer CRM, and Profile Moderation.
// ============================================================

import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../config/database';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { OrderStatus, NfcCardStatus, SubscriptionTier, UserRole, VerificationStatus } from '@prisma/client';

// ============================================================
//  1. EXECUTIVE ANALYTICS
// ============================================================

export async function getAnalytics(req: Request, res: Response): Promise<void> {
  try {
    const totalUsersCount = await prisma.user.count();
    const activeProfilesCount = await prisma.profile.count({
      where: { status: 'ACTIVE' },
    });
    const totalOrdersCount = await prisma.order.count();
    const pendingOrdersCount = await prisma.order.count({
      where: { status: 'PENDING' },
    });
    const pendingVerificationsCount = await prisma.verificationRequest.count({
      where: { status: 'PENDING' },
    });

    // Total revenue from non-cancelled orders
    const orders = await prisma.order.findMany({
      where: { status: { not: 'CANCELLED' } },
      select: { totalAmount: true, createdAt: true },
    });
    const totalRevenue = orders.reduce((sum, ord) => sum + (ord.totalAmount || 0), 0);

    // Total tap count across all profiles
    const profilesWithTaps = await prisma.profile.findMany({
      select: { tapCount: true },
    });
    const totalTaps = profilesWithTaps.reduce((sum, p) => sum + (p.tapCount || 0), 0);

    // Card stock metrics
    const products = await prisma.product.findMany();
    const totalStock = products.reduce((sum, p) => sum + p.stockQuantity, 0);
    const lowStockCount = products.filter(p => p.stockQuantity <= p.lowStockThreshold).length;

    // Recent orders for quick dashboard view
    const recentOrders = await prisma.order.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { items: { include: { product: true } } },
    });

    sendSuccess(res, {
      metrics: {
        totalUsers: totalUsersCount,
        activeProfiles: activeProfilesCount,
        totalOrders: totalOrdersCount,
        pendingOrders: pendingOrdersCount,
        pendingVerifications: pendingVerificationsCount,
        totalRevenue,
        totalTaps,
        totalStock,
        lowStockAlerts: lowStockCount,
      },
      recentOrders,
    });
  } catch (error) {
    console.error('getAnalytics error:', error);
    sendError(res, 'Failed to fetch admin analytics.', 500);
  }
}

// ============================================================
//  2. INVENTORY & SKU MANAGEMENT
// ============================================================

export async function getInventory(req: Request, res: Response): Promise<void> {
  try {
    let products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });

    // If products table is empty, auto-seed with standard TAGIT card SKUs
    if (products.length === 0) {
      await prisma.product.createMany({
        data: [
          {
            sku: 'TAGIT-MATTE-BLK',
            name: 'TAGIT Matte Black NFC Card',
            description: 'Sleek matte finish PVC with embedded NTAG216 chip & laser etched QR.',
            price: 4500,
            stockQuantity: 120,
            lowStockThreshold: 20,
            nfcChipType: 'NTAG216',
            imageUrl: 'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?auto=format&fit=crop&w=600&q=80',
          },
          {
            sku: 'TAGIT-OBSIDIAN-MTL',
            name: 'TAGIT Obsidian Metal NFC Card',
            description: 'Heavyweight brushed stainless steel with precision laser engraving.',
            price: 12500,
            stockQuantity: 45,
            lowStockThreshold: 10,
            nfcChipType: 'NTAG216',
            imageUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=600&q=80',
          },
          {
            sku: 'TAGIT-BAMBOO-ECO',
            name: 'TAGIT Bamboo Eco NFC Card',
            description: 'Sustainable natural bamboo wood card with organic laser finish.',
            price: 6500,
            stockQuantity: 80,
            lowStockThreshold: 15,
            nfcChipType: 'NTAG215',
            imageUrl: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=600&q=80',
          },
          {
            sku: 'TAGIT-CARBON-PRO',
            name: 'TAGIT Carbon Fiber Pro Card',
            description: 'Real woven 3K carbon fiber matrix for maximum durability and prestige.',
            price: 18000,
            stockQuantity: 25,
            lowStockThreshold: 5,
            nfcChipType: 'NTAG216',
            imageUrl: 'https://images.unsplash.com/photo-1589739900243-4b52cd9b104e?auto=format&fit=crop&w=600&q=80',
          },
        ],
      });
      products = await prisma.product.findMany({ orderBy: { createdAt: 'desc' } });
    }

    sendSuccess(res, products);
  } catch (error) {
    console.error('getInventory error:', error);
    sendError(res, 'Failed to fetch inventory products.', 500);
  }
}

export async function upsertProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id, sku, name, description, price, stockQuantity, lowStockThreshold, nfcChipType, imageUrl } = req.body;

    if (!sku || !name || price === undefined) {
      sendError(res, 'SKU, Name, and Price are required.', 400);
      return;
    }

    if (id) {
      const updated = await prisma.product.update({
        where: { id },
        data: {
          sku,
          name,
          description,
          price: Number(price),
          stockQuantity: Number(stockQuantity || 0),
          lowStockThreshold: Number(lowStockThreshold || 10),
          nfcChipType: nfcChipType || 'NTAG215',
          imageUrl,
        },
      });
      sendSuccess(res, updated, 'Product updated successfully.');
    } else {
      const created = await prisma.product.create({
        data: {
          sku,
          name,
          description,
          price: Number(price),
          stockQuantity: Number(stockQuantity || 0),
          lowStockThreshold: Number(lowStockThreshold || 10),
          nfcChipType: nfcChipType || 'NTAG215',
          imageUrl,
        },
      });
      sendSuccess(res, created, 'New product added successfully.', 201);
    }
  } catch (error) {
    console.error('upsertProduct error:', error);
    sendError(res, 'Failed to save product SKU.', 500);
  }
}

export async function deleteProduct(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    await prisma.product.delete({ where: { id } });
    sendSuccess(res, null, 'Product deleted successfully.');
  } catch (error) {
    console.error('deleteProduct error:', error);
    sendError(res, 'Failed to delete product.', 500);
  }
}

// ============================================================
//  3. NFC CARD PROVISIONING & ENCODING
// ============================================================

export async function getNfcCards(req: Request, res: Response): Promise<void> {
  try {
    const cards = await prisma.nfcCardItem.findMany({
      take: 100,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { name: true, sku: true } },
        batch: { select: { batchNumber: true } },
        assignedUser: { select: { email: true, profiles: { select: { displayName: true, username: true } } } },
      },
    });
    sendSuccess(res, cards);
  } catch (error) {
    console.error('getNfcCards error:', error);
    sendError(res, 'Failed to fetch NFC cards.', 500);
  }
}

export async function createNfcCardBatch(req: Request, res: Response): Promise<void> {
  try {
    const { batchNumber, productId, count = 10, description } = req.body;

    if (!batchNumber || !productId) {
      sendError(res, 'Batch Number and Product ID are required.', 400);
      return;
    }

    const batch = await prisma.nfcCardBatch.create({
      data: {
        batchNumber,
        productId,
        description: description || `Production Batch of ${count} cards`,
        totalCards: Number(count),
      },
    });

    // Generate unique physical card records with 8-digit PINs
    const itemsToCreate = [];
    const timestamp = Date.now().toString().slice(-6);

    for (let i = 1; i <= Number(count); i++) {
      const padIndex = i.toString().padStart(3, '0');
      const serialNumber = `TG-${timestamp}-${padIndex}`;
      // Simulate hardware UID e.g. 04:A1:B2:C3:D4:E5:F6
      const randHex = () => Math.floor(Math.random() * 256).toString(16).toUpperCase().padStart(2, '0');
      const uid = `04:${randHex()}:${randHex()}:${randHex()}:${randHex()}:${randHex()}:${randHex()}`;
      // Generate 8-digit activation PIN
      const pinPart1 = Math.floor(1000 + Math.random() * 9000);
      const pinPart2 = Math.floor(1000 + Math.random() * 9000);
      const activationCode = `${pinPart1}-${pinPart2}`;

      itemsToCreate.push({
        uid,
        serialNumber,
        activationCode,
        status: NfcCardStatus.UNASSIGNED,
        productId,
        batchId: batch.id,
      });
    }

    await prisma.nfcCardItem.createMany({ data: itemsToCreate });

    // Also increase stock quantity on the product
    await prisma.product.update({
      where: { id: productId },
      data: { stockQuantity: { increment: Number(count) } },
    });

    const createdCards = await prisma.nfcCardItem.findMany({
      where: { batchId: batch.id },
    });

    sendSuccess(res, { batch, cards: createdCards }, `Batch ${batchNumber} provisioned successfully with ${count} NFC cards.`, 201);
  } catch (error) {
    console.error('createNfcCardBatch error:', error);
    sendError(res, 'Failed to provision NFC card batch.', 500);
  }
}

export async function assignNfcCard(req: Request, res: Response): Promise<void> {
  try {
    const { cardId, userEmail, uid } = req.body;

    let card;
    if (cardId) {
      card = await prisma.nfcCardItem.findUnique({ where: { id: cardId } });
    } else if (uid) {
      card = await prisma.nfcCardItem.findUnique({ where: { uid } });
    }

    if (!card) {
      sendError(res, 'NFC Card not found.', 404);
      return;
    }

    if (!userEmail) {
      // Unassign
      const updated = await prisma.nfcCardItem.update({
        where: { id: card.id },
        data: { assignedUserId: null, status: NfcCardStatus.UNASSIGNED, activatedAt: null },
      });
      sendSuccess(res, updated, 'Card unassigned successfully.');
      return;
    }

    const user = await prisma.user.findUnique({ where: { email: userEmail } });
    if (!user) {
      sendError(res, `User with email ${userEmail} not found.`, 404);
      return;
    }

    const updated = await prisma.nfcCardItem.update({
      where: { id: card.id },
      data: {
        assignedUserId: user.id,
        status: NfcCardStatus.ACTIVATED,
        activatedAt: new Date(),
      },
    });

    sendSuccess(res, updated, `Card linked to ${userEmail} successfully.`);
  } catch (error) {
    console.error('assignNfcCard error:', error);
    sendError(res, 'Failed to assign card.', 500);
  }
}

// ============================================================
//  4. ORDERS & FULFILLMENT PIPELINE
// ============================================================

export async function getOrders(req: Request, res: Response): Promise<void> {
  try {
    const { status } = req.query;
    const whereClause: any = {};
    if (status && status !== 'ALL') {
      whereClause.status = status as OrderStatus;
    }

    let orders = await prisma.order.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        items: { include: { product: true } },
        user: { select: { email: true, profiles: { select: { displayName: true } } } },
      },
    });

    // Auto seed sample order if empty so user can see live demo right away
    if (orders.length === 0 && !status) {
      const product = await prisma.product.findFirst();
      if (product) {
        await prisma.order.create({
          data: {
            orderNumber: `ORD-${Date.now().toString().slice(-6)}`,
            customerEmail: 'alex.miller@enterprise.com',
            customerName: 'Alex Miller',
            shippingAddress: '450 Lexington Ave, Suite 1400, New York, NY 10017',
            phone: '+1 (212) 555-0199',
            status: OrderStatus.PROCESSING,
            totalAmount: 12500,
            courier: 'DHL Express / Pronto',
            items: {
              create: [
                {
                  productId: product.id,
                  quantity: 1,
                  unitPrice: 12500,
                  customEngravingText: 'ALEX MILLER — CEO',
                },
              ],
            },
          },
        });
        orders = await prisma.order.findMany({
          orderBy: { createdAt: 'desc' },
          include: {
            items: { include: { product: true } },
            user: { select: { email: true, profiles: { select: { displayName: true } } } },
          },
        });
      }
    }

    sendSuccess(res, orders);
  } catch (error) {
    console.error('getOrders error:', error);
    sendError(res, 'Failed to fetch orders.', 500);
  }
}

export async function updateOrderStatus(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, trackingNumber, courier } = req.body;

    const updateData: any = {};
    if (status) updateData.status = status as OrderStatus;
    if (trackingNumber !== undefined) updateData.trackingNumber = trackingNumber;
    if (courier !== undefined) updateData.courier = courier;
    if (status === 'SHIPPED') updateData.shippedAt = new Date();
    if (status === 'DELIVERED') updateData.deliveredAt = new Date();

    const updated = await prisma.order.update({
      where: { id },
      data: updateData,
      include: { items: { include: { product: true } } },
    });

    sendSuccess(res, updated, `Order ${updated.orderNumber} updated to ${status}.`);
  } catch (error) {
    console.error('updateOrderStatus error:', error);
    sendError(res, 'Failed to update order.', 500);
  }
}

// ============================================================
//  5. CUSTOMER CRM & ROLE MANAGEMENT
// ============================================================

export async function getUsers(req: Request, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        profiles: true,
        assignedCards: true,
        orders: { select: { id: true, totalAmount: true } },
      },
    });

    const formatted = users.map(u => {
      const primaryProfile = u.profiles.find(p => p.isDefault) ?? u.profiles[0] ?? null;
      return {
        id: u.id,
        email: u.email,
        role: u.role,
        authProvider: u.authProvider,
        subscriptionTier: u.subscriptionTier,
        createdAt: u.createdAt,
        profile: primaryProfile ? {
          id: primaryProfile.id,
          username: primaryProfile.username,
          displayName: primaryProfile.displayName,
          status: primaryProfile.status,
          tapCount: primaryProfile.tapCount,
          profilePicture: primaryProfile.profilePicture,
        } : null,
        totalOrders: u.orders.length,
        assignedCardsCount: u.assignedCards.length,
      };
    });

    sendSuccess(res, formatted);
  } catch (error) {
    console.error('getUsers error:', error);
    sendError(res, 'Failed to fetch users CRM directory.', 500);
  }
}

export async function updateUserRoleTier(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { role, subscriptionTier, profileStatus } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        ...(role && { role: role as UserRole }),
        ...(subscriptionTier && { subscriptionTier: subscriptionTier as SubscriptionTier }),
      },
      include: { profiles: true },
    });

    if (profileStatus && user.profiles.length > 0) {
      const targetProfile = user.profiles.find(p => p.isDefault) ?? user.profiles[0];
      if (targetProfile) {
        await prisma.profile.update({
          where: { id: targetProfile.id },
          data: { status: profileStatus },
        });
      }
    }

    sendSuccess(res, user, `User ${user.email} updated successfully.`);
  } catch (error) {
    console.error('updateUserRoleTier error:', error);
    sendError(res, 'Failed to update user parameters.', 500);
  }
}

export async function createAdminUser(req: Request, res: Response): Promise<void> {
  try {
    const { email, password, username, displayName } = req.body;

    if (!email || !password || !username || !displayName) {
      sendError(res, 'All fields (email, password, username, displayName) are required.', 400);
      return;
    }

    // Check if email already exists
    const existingEmail = await prisma.user.findUnique({ where: { email } });
    if (existingEmail) {
      sendError(res, 'Email already registered.', 400);
      return;
    }

    // Check if username already exists
    const existingUsername = await prisma.profile.findUnique({ where: { username } });
    if (existingUsername) {
      sendError(res, 'Username already taken.', 400);
      return;
    }

    // Hash password with cost factor 12
    const passwordHash = await bcrypt.hash(password, 12);

    const newAdmin = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: UserRole.ADMIN,
        subscriptionTier: SubscriptionTier.FREE,
        authProvider: 'EMAIL',
        profiles: {
          create: [
            {
              username,
              displayName,
              status: 'ACTIVE',
              isDefault: true,
            },
          ],
        },
      },
      include: { profiles: true },
    });

    sendSuccess(res, newAdmin, 'New admin user created successfully.', 201);
  } catch (error) {
    console.error('createAdminUser error:', error);
    sendError(res, 'Failed to create new admin user.', 500);
  }
}

// ============================================================
//  6. PROFILE MODERATION QUEUE
// ============================================================

export async function getVerifications(req: Request, res: Response): Promise<void> {
  try {
    const requests = await prisma.verificationRequest.findMany({
      orderBy: { requestedAt: 'desc' },
      include: {
        profile: { select: { id: true, username: true, displayName: true, profilePicture: true } },
      },
    });
    sendSuccess(res, requests);
  } catch (error) {
    console.error('getVerifications error:', error);
    sendError(res, 'Failed to fetch verification requests.', 500);
  }
}

export async function moderateVerification(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const { status, moderationNote } = req.body; // APPROVED or REJECTED

    const reqItem = await prisma.verificationRequest.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!reqItem) {
      sendError(res, 'Verification request not found.', 404);
      return;
    }

    const updated = await prisma.verificationRequest.update({
      where: { id },
      data: {
        status: status as VerificationStatus,
        moderationNote: moderationNote || `Reviewed by Admin (${status})`,
        reviewedAt: new Date(),
      },
    });

    // If approved, apply the new value directly to the profile
    if (status === 'APPROVED' && reqItem.profile) {
      const updatePayload: any = {};
      if (reqItem.fieldName === 'displayName') updatePayload.displayName = reqItem.newValue;
      if (reqItem.fieldName === 'profilePicture') updatePayload.profilePicture = reqItem.newValue;
      if (reqItem.fieldName === 'companyLogo') updatePayload.companyLogo = reqItem.newValue;

      if (Object.keys(updatePayload).length > 0) {
        await prisma.profile.update({
          where: { id: reqItem.profileId },
          data: updatePayload,
        });
      }
    }

    sendSuccess(res, updated, `Verification request ${status} successfully.`);
  } catch (error) {
    console.error('moderateVerification error:', error);
    sendError(res, 'Failed to moderate verification.', 500);
  }
}

// ============================================================
//  7. BULK PROVISIONING & RAPID MODERATION
// ============================================================

/**
 * POST /api/v1/admin/nfc/bulk-provision
 * Automatically provisions an NFC card when read by Web NFC or USB Wedge Scanner.
 */
export async function bulkProvisionNfcCards(req: Request, res: Response): Promise<void> {
  try {
    const { uid, productId, batchNumber } = req.body;

    if (!uid) {
      sendError(res, 'Hardware UID (`uid`) read from card is required.', 400);
      return;
    }

    // Check if UID is already provisioned
    const existing = await prisma.nfcCardItem.findUnique({ where: { uid: uid.trim() } });
    if (existing) {
      sendSuccess(res, {
        card: existing,
        alreadyProvisioned: true,
        activationUrl: `https://tagit.lk/activate?code=${existing.activationCode}`,
      }, `Card UID ${uid} is already provisioned as ${existing.serialNumber}.`);
      return;
    }

    let batchId: string | undefined;
    if (batchNumber) {
      let batch = await prisma.nfcCardBatch.findUnique({ where: { batchNumber } });
      if (!batch) {
        batch = await prisma.nfcCardBatch.create({
          data: { batchNumber, description: 'Created during bulk provisioning studio scan' },
        });
      }
      batchId = batch.id;
    }

    const timestamp = Date.now().toString().slice(-6);
    const randPart = Math.floor(100 + Math.random() * 900);
    const serialNumber = `TG-${timestamp}-${randPart}`;

    const pinPart1 = Math.floor(1000 + Math.random() * 9000);
    const pinPart2 = Math.floor(1000 + Math.random() * 9000);
    const activationCode = `${pinPart1}-${pinPart2}`;

    const newCard = await prisma.nfcCardItem.create({
      data: {
        uid: uid.trim(),
        serialNumber,
        activationCode,
        status: NfcCardStatus.UNASSIGNED,
        productId: productId || null,
        batchId: batchId || null,
      },
    });

    sendSuccess(res, {
      card: newCard,
      alreadyProvisioned: false,
      activationUrl: `https://tagit.lk/activate?code=${activationCode}`,
    }, `Successfully provisioned new NFC Card ${serialNumber}!`, 201);
  } catch (error) {
    console.error('bulkProvisionNfcCards error:', error);
    sendError(res, 'Failed to auto-provision NFC card.', 500);
  }
}

/**
 * PATCH /api/v1/admin/verifications/bulk-moderate
 * Rapid bulk moderation for Tinder-style swipe UI and grid selection.
 */
export async function bulkModerateVerifications(req: Request, res: Response): Promise<void> {
  try {
    const { items } = req.body; // Array<{ id: string; action: 'APPROVE' | 'REJECT'; note?: string }>

    if (!Array.isArray(items) || items.length === 0) {
      sendError(res, 'An array of verification items is required.', 400);
      return;
    }

    let approvedCount = 0;
    let rejectedCount = 0;

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        const status: VerificationStatus = item.action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
        const reqRecord = await tx.verificationRequest.findUnique({
          where: { id: item.id },
        });

        if (!reqRecord || reqRecord.status !== 'PENDING') continue;

        await tx.verificationRequest.update({
          where: { id: item.id },
          data: {
            status,
            moderationNote: item.note || `Bulk reviewed (${status})`,
            reviewedAt: new Date(),
          },
        });

        if (status === 'APPROVED') {
          approvedCount++;
          const updateData: any = {};
          if (reqRecord.fieldName === 'displayName') updateData.displayName = reqRecord.newValue;
          if (reqRecord.fieldName === 'profilePicture') updateData.profilePicture = reqRecord.newValue;
          if (reqRecord.fieldName === 'companyLogo') updateData.companyLogo = reqRecord.newValue;

          if (Object.keys(updateData).length > 0) {
            await tx.profile.update({
              where: { id: reqRecord.profileId },
              data: updateData,
            });
          }
        } else {
          rejectedCount++;
        }
      }
    });

    sendSuccess(res, { approvedCount, rejectedCount }, `Successfully moderated ${items.length} verification requests.`);
  } catch (error) {
    console.error('bulkModerateVerifications error:', error);
    sendError(res, 'Failed to process bulk moderation.', 500);
  }
}

