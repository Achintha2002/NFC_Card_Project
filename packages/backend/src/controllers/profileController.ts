// ============================================================
//  NEXUS — Profile Controller
//  Handles: public profile fetch, instant updates, moderated
//  updates (with VerificationRequest injection), privacy toggle,
//  tap count increment, and vCard generation.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ProfileStatus, VerificationStatus } from '@prisma/client';

import { prisma } from '../config/database';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { AppError } from '../middlewares/errorMiddleware';
import { generateVCardBuffer } from '../utils/vcardGenerator';

// ── Validation Schemas ────────────────────────────────────────

/** Fields that update the Profile row immediately */
const instantUpdateSchema = z.object({
  bio: z.string().max(500).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().optional(),
  company: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  website: z.string().url().optional(),
});

/** Fields that create a VerificationRequest instead of direct update */
const moderatedUpdateSchema = z.object({
  displayName: z.string().min(2).max(100).optional(),
  // profilePicture and companyLogo arrive as uploaded file paths via multer
});

// ── Controllers ───────────────────────────────────────────────

/**
 * GET /api/v1/profile/:username
 * Public, unauthenticated endpoint.
 * Increments the tap counter on every successful fetch.
 * Blocks access if profile status is STEALTH or SUSPENDED.
 */
export async function getPublicProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { username } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { username },
      include: {
        links: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!profile) {
      throw new AppError('Profile not found.', 404);
    }

    if (profile.status === ProfileStatus.STEALTH) {
      // Return a stealth placeholder — don't reveal profile existence
      sendSuccess(res, { status: 'STEALTH' }, 'This profile is currently private.');
      return;
    }

    if (profile.status === ProfileStatus.SUSPENDED) {
      sendError(res, 'This profile has been suspended.', 403);
      return;
    }

    // Increment tap count asynchronously (fire-and-forget to avoid blocking)
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? req.socket.remoteAddress
      ?? undefined;
    const userAgent = req.headers['user-agent'] ?? '';
    const referrer = req.headers['referer'] ?? req.headers['referrer'] ?? undefined;
    const deviceType = /mobile|android|iphone|ipad/i.test(userAgent)
      ? 'MOBILE'
      : /tablet|ipad/i.test(userAgent)
        ? 'TABLET'
        : 'DESKTOP';

    prisma.profile
      .update({
        where: { id: profile.id },
        data: { tapCount: { increment: 1 } },
      })
      .catch((err: Error) =>
        console.warn('⚠️ Failed to increment tap count:', err.message),
      );

    // Record detailed analytics row
    prisma.tapAnalytics
      .create({
        data: {
          profileId: profile.id,
          ipAddress,
          userAgent,
          deviceType,
          referrer: referrer as string | undefined,
        },
      })
      .catch((err: Error) =>
        console.warn('⚠️ Failed to record tap analytics:', err.message),
      );

    // Strip sensitive fields before sending public response
    const { userId: _userId, ...publicProfile } = profile;

    sendSuccess(res, publicProfile);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/profile/:username/vcard
 * Generates and streams a VCF file for the "Add to Contacts" feature.
 * Public, unauthenticated.
 */
export async function downloadVCard(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { username } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { username },
      include: {
        links: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!profile || profile.status !== ProfileStatus.ACTIVE) {
      throw new AppError('Profile not available.', 404);
    }

    const vcardBuffer = generateVCardBuffer(profile);
    const safeUsername = username.replace(/[^a-z0-9_-]/gi, '');

    res.set({
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${safeUsername}.vcf"`,
      'Content-Length': String(vcardBuffer.length),
      'Cache-Control': 'no-cache',
    });

    res.status(200).end(vcardBuffer);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/profile/instant
 * Protected. Updates bio, phone, email, company, jobTitle, website directly.
 * These fields are trusted and update the profile table immediately.
 */
export async function instantUpdate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { profileId } = req.user!;
    const data = instantUpdateSchema.parse(req.body);

    // Only apply non-undefined fields
    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    if (Object.keys(filteredData).length === 0) {
      throw new AppError('No valid fields provided for update.', 400);
    }

    const updated = await prisma.profile.update({
      where: { id: profileId },
      data: filteredData,
      select: {
        id: true,
        username: true,
        displayName: true,
        bio: true,
        phone: true,
        email: true,
        company: true,
        jobTitle: true,
        website: true,
        updatedAt: true,
      },
    });

    sendSuccess(res, updated, 'Profile updated successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/profile/moderated
 * Protected. Changes to displayName, profilePicture, or companyLogo
 * do NOT update the profile table directly. Instead, they inject a
 * VerificationRequest record with PENDING status.
 * The profile goes live ONLY when the request is APPROVED.
 *
 * Image files arrive via multer (uploadFields middleware).
 * AI moderation runs on images via moderationMiddleware before this controller.
 */
export async function moderatedUpdate(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { profileId } = req.user!;
    const { moderationResult } = req;
    const body = moderatedUpdateSchema.parse(req.body);
    const files = req.files as Record<string, Express.Multer.File[]> | undefined;

    // If the uploaded image was flagged by the AI moderation pipeline
    if (moderationResult && !moderationResult.isSafe) {
      throw new AppError(
        `Your image was flagged by our AI safety system and has been rejected. ` +
        `Detected: ${moderationResult.detectedLabels.join(', ')}. ` +
        `Please upload an appropriate professional image.`,
        403,
      );
    }

    const pendingRequests: {
      profileId: string;
      fieldName: string;
      newValue: string;
      status: VerificationStatus;
      moderationNote?: string;
    }[] = [];

    // Queue display name change for review
    if (body.displayName) {
      pendingRequests.push({
        profileId,
        fieldName: 'displayName',
        newValue: body.displayName,
        status: VerificationStatus.PENDING,
      });
    }

    // Queue profile picture change for review
    if (files?.['profilePicture']?.[0]) {
      const file = files['profilePicture'][0];
      const imageUrl = `${process.env.API_BASE_URL ?? 'http://localhost:4000'}/uploads/${file.filename}`;

      pendingRequests.push({
        profileId,
        fieldName: 'profilePicture',
        newValue: imageUrl,
        status: moderationResult?.isSafe === true
          ? VerificationStatus.PENDING
          : VerificationStatus.PENDING,
        moderationNote: moderationResult
          ? `AI Check (${moderationResult.provider}): safe=${moderationResult.isSafe}, confidence=${moderationResult.confidence.toFixed(1)}%`
          : undefined,
      });
    }

    // Queue company logo change for review
    if (files?.['companyLogo']?.[0]) {
      const file = files['companyLogo'][0];
      const imageUrl = `${process.env.API_BASE_URL ?? 'http://localhost:4000'}/uploads/${file.filename}`;

      pendingRequests.push({
        profileId,
        fieldName: 'companyLogo',
        newValue: imageUrl,
        status: VerificationStatus.PENDING,
        moderationNote: moderationResult
          ? `AI Check (${moderationResult.provider}): safe=${moderationResult.isSafe}`
          : undefined,
      });
    }

    if (pendingRequests.length === 0) {
      throw new AppError('No moderated fields were provided.', 400);
    }

    // Create all VerificationRequest records in a batch
    await prisma.verificationRequest.createMany({
      data: pendingRequests,
    });

    sendSuccess(
      res,
      {
        pendingFields: pendingRequests.map((r) => r.fieldName),
        message:
          'Your changes are under review. Sensitive fields like photos and display names ' +
          'require AI safety moderation before going live. This typically takes a few moments.',
      },
      'Changes submitted for moderation.',
      202, // 202 Accepted — request received but not yet applied
    );
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/profile/privacy
 * Protected. Toggles the profile status between ACTIVE and STEALTH.
 * STEALTH mode hides the public profile page instantly.
 */
export async function togglePrivacy(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { profileId } = req.user!;

    const current = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { status: true },
    });

    if (!current) {
      throw new AppError('Profile not found.', 404);
    }

    if (current.status === ProfileStatus.SUSPENDED) {
      throw new AppError('Cannot toggle privacy on a suspended profile.', 403);
    }

    const newStatus =
      current.status === ProfileStatus.STEALTH
        ? ProfileStatus.ACTIVE
        : ProfileStatus.STEALTH;

    const updated = await prisma.profile.update({
      where: { id: profileId },
      data: { status: newStatus },
      select: { id: true, status: true, updatedAt: true },
    });

    sendSuccess(
      res,
      updated,
      `Profile is now ${newStatus === ProfileStatus.STEALTH ? '🥷 Stealth (hidden)' : '✅ Active (visible)'}`,
    );
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/profile/me
 * Protected. Returns the full profile of the authenticated user
 * including analytics and all links (active + inactive).
 */
export async function getMyProfile(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { profileId } = req.user!;

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      include: {
        links: { orderBy: { sortOrder: 'asc' } },
        verificationRequests: {
          where: { status: VerificationStatus.PENDING },
          orderBy: { requestedAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!profile) {
      throw new AppError('Profile not found.', 404);
    }

    sendSuccess(res, profile);
  } catch (error) {
    next(error);
  }
}
