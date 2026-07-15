// ============================================================
//  NEXUS — Link Controller
//  Handles CRUD for profile links and the isActive toggle.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { LinkPlatform } from '@prisma/client';

import { prisma } from '../config/database';
import { sendSuccess } from '../utils/responseHelper';
import { AppError } from '../middlewares/errorMiddleware';
import { parseUserAgent, resolveLocation } from '../utils/analyticsHelper';

// ── Validation Schemas ────────────────────────────────────────

const createLinkSchema = z.object({
  platform: z.nativeEnum(LinkPlatform).default(LinkPlatform.CUSTOM),
  url: z.string().url('Must be a valid URL').max(2048),
  label: z.string().min(1, 'Label is required').max(100),
  iconType: z.string().max(50).optional(),
  sortOrder: z.number().int().min(0).default(0),
  isActive: z.boolean().default(true),
});

const updateLinkSchema = createLinkSchema.partial().omit({ platform: true });

// ── Helper: Verify Link Ownership ────────────────────────────
async function assertLinkOwnership(
  linkId: string,
  profileId: string,
): Promise<void> {
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    select: { profileId: true },
  });

  if (!link) {
    throw new AppError('Link not found.', 404);
  }

  if (link.profileId !== profileId) {
    throw new AppError('You do not have permission to modify this link.', 403);
  }
}

// ── Controllers ───────────────────────────────────────────────

/**
 * GET /api/v1/links
 * Returns all links (active and inactive) for the authenticated user's profile.
 */
export async function getLinks(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { profileId } = req.user!;

    const links = await prisma.link.findMany({
      where: { profileId },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    sendSuccess(res, links, undefined, 200, { total: links.length });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/links
 * Adds a new link to the authenticated user's profile.
 */
export async function createLink(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { profileId } = req.user!;
    const data = createLinkSchema.parse(req.body);

    // Enforce a per-profile link limit based on subscription tier
    const existingCount = await prisma.link.count({ where: { profileId } });
    const limits = { FREE: 5, PREMIUM: 25, CORPORATE: 100 };
    const tier = req.user!.subscriptionTier;
    const limit = limits[tier];

    if (existingCount >= limit) {
      throw new AppError(
        `Your ${tier} plan allows a maximum of ${limit} links. Upgrade to add more.`,
        403,
      );
    }

    const link = await prisma.link.create({
      data: {
        ...data,
        profileId,
      },
    });

    sendSuccess(res, link, 'Link added successfully.', 201);
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/links/:id
 * Updates a link's properties (label, url, sortOrder, etc.).
 * Does NOT allow changing the platform after creation.
 */
export async function updateLink(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { profileId } = req.user!;
    const { id } = req.params;
    const data = updateLinkSchema.parse(req.body);

    await assertLinkOwnership(id, profileId);

    const filteredData = Object.fromEntries(
      Object.entries(data).filter(([, v]) => v !== undefined),
    );

    const updated = await prisma.link.update({
      where: { id },
      data: filteredData,
    });

    sendSuccess(res, updated, 'Link updated successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/links/:id/toggle
 * Instantly toggles the isActive state of a link.
 * This is the primary action from the Link Management Matrix in the mobile app.
 */
export async function toggleLink(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { profileId } = req.user!;
    const { id } = req.params;

    await assertLinkOwnership(id, profileId);

    const link = await prisma.link.findUnique({
      where: { id },
      select: { isActive: true },
    });

    const updated = await prisma.link.update({
      where: { id },
      data: { isActive: !link!.isActive },
      select: { id: true, isActive: true, label: true, platform: true, updatedAt: true },
    });

    sendSuccess(
      res,
      updated,
      `Link "${updated.label}" is now ${updated.isActive ? '✅ Active' : '⚫ Hidden'}`,
    );
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/v1/links/:id
 * Permanently removes a link from the profile.
 */
export async function deleteLink(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { profileId } = req.user!;
    const { id } = req.params;

    await assertLinkOwnership(id, profileId);

    await prisma.link.delete({ where: { id } });

    sendSuccess(res, { id }, 'Link deleted successfully.');
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/links/reorder
 * Updates sort order for multiple links in a single transaction.
 * Payload: [{ id: string, sortOrder: number }]
 */
export async function reorderLinks(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { profileId } = req.user!;

    const reorderSchema = z.array(
      z.object({ id: z.string().cuid(), sortOrder: z.number().int().min(0) }),
    );
    const items = reorderSchema.parse(req.body);

    // Verify all links belong to this profile before updating
    const linkIds = items.map((i) => i.id);
    const ownedLinks = await prisma.link.findMany({
      where: { id: { in: linkIds }, profileId },
      select: { id: true },
    });

    if (ownedLinks.length !== linkIds.length) {
      throw new AppError(
        'One or more links do not belong to your profile.',
        403,
      );
    }

    // Batch update sortOrders in a transaction
    await prisma.$transaction(
      items.map((item) =>
        prisma.link.update({
          where: { id: item.id },
          data: { sortOrder: item.sortOrder },
        }),
      ),
    );

    sendSuccess(res, { updated: items.length }, 'Link order updated.');
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/links/:id/click
 * Public, unauthenticated endpoint.
 * Increments link clickCount and records LinkClickAnalytics.
 */
export async function recordLinkClick(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { id } = req.params;

    const link = await prisma.link.findUnique({
      where: { id },
      select: { id: true, profileId: true, url: true, isActive: true },
    });

    if (!link || !link.isActive) {
      throw new AppError('Link not available.', 404);
    }

    const rawIp = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress;
    const uaString = req.headers['user-agent'];
    const parsedUa = parseUserAgent(uaString);

    Promise.all([
      prisma.link.update({
        where: { id: link.id },
        data: { clickCount: { increment: 1 } },
      }),
      resolveLocation(rawIp, req.headers as Record<string, string | string[] | undefined>).then((geo) =>
        prisma.linkClickAnalytics.create({
          data: {
            profileId: link.profileId,
            linkId: link.id,
            ipAddress: geo.ip,
            userAgent: uaString,
            device: parsedUa.device,
            browser: parsedUa.browser,
            os: parsedUa.os,
            location: geo.location,
            country: geo.country,
            city: geo.city,
          },
        })
      ),
    ]).catch((err: Error) =>
      console.warn('⚠️ Failed to record link click & analytics:', err.message),
    );

    sendSuccess(res, { url: link.url }, 'Link click recorded.');
  } catch (error) {
    next(error);
  }
}
