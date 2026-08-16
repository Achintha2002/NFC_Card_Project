// ============================================================
//  TAGIT — Portfolio Controller
//  Handles all CRUD operations for portfolio and its sections.
//  All mutating endpoints require ownership verification.
// ============================================================

import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { z } from 'zod';

// ── Validation Schemas ────────────────────────────────────────

const HEX_COLOR = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;

const portfolioUpdateSchema = z.object({
  theme: z
    .enum(['MIDNIGHT_LUXE', 'ARCTIC_FROST', 'SUNSET_EMBER', 'OCEAN_DEPTH', 'MONOCHROME_ELITE'])
    .optional(),
  primaryColor: z.string().regex(HEX_COLOR, 'Invalid hex color').optional(),
  accentColor: z.string().regex(HEX_COLOR, 'Invalid hex color').optional(),
  headline: z.string().max(120).optional().nullable(),
  subheadline: z.string().max(200).optional().nullable(),
  ctaText: z.string().max(40).optional().nullable(),
  ctaUrl: z.string().url().optional().nullable(),
  heroImageUrl: z.string().url().optional().nullable(),
  metaTitle: z.string().max(70).optional().nullable(),
  metaDescription: z.string().max(160).optional().nullable(),
});

const sectionContentSchemas = {
  HERO: z.object({
    backgroundType: z.enum(['color', 'image', 'gradient']).optional(),
    overlayOpacity: z.number().min(0).max(1).optional(),
  }),
  ABOUT: z.object({
    text: z.string(),
    imageUrl: z.string().url().optional().nullable(),
  }),
  EXPERIENCE: z.object({
    items: z.array(
      z.object({
        company: z.string(),
        role: z.string(),
        period: z.string(),
        description: z.string().optional(),
        logoUrl: z.string().url().optional().nullable(),
      }),
    ),
  }),
  PROJECTS: z.object({
    items: z.array(
      z.object({
        title: z.string(),
        description: z.string().optional(),
        imageUrl: z.string().url().optional().nullable(),
        liveUrl: z.string().url().optional().nullable(),
        githubUrl: z.string().url().optional().nullable(),
        tags: z.array(z.string()).optional(),
      }),
    ),
  }),
  SKILLS: z.object({
    items: z.array(
      z.object({
        name: z.string(),
        proficiency: z.number().min(0).max(100),
        category: z.string().optional(),
      }),
    ),
  }),
  TESTIMONIALS: z.object({
    items: z.array(
      z.object({
        quote: z.string(),
        author: z.string(),
        role: z.string().optional(),
        company: z.string().optional(),
        avatarUrl: z.string().url().optional().nullable(),
      }),
    ),
  }),
  GALLERY: z.object({
    images: z.array(
      z.object({
        url: z.string().url(),
        caption: z.string().optional(),
        alt: z.string().optional(),
      }),
    ),
    layout: z.enum(['grid', 'masonry']).optional(),
  }),
  CONTACT: z.object({
    showEmail: z.boolean().optional(),
    showPhone: z.boolean().optional(),
    showForm: z.boolean().optional(),
    formWebhook: z.string().url().optional().nullable(),
  }),
  STATS: z.object({
    items: z.array(
      z.object({
        value: z.number(),
        label: z.string(),
        suffix: z.string().optional(),
      }),
    ),
  }),
  CUSTOM_HTML: z.object({
    html: z.string(),
  }),
};

const addSectionSchema = z.object({
  type: z.enum([
    'HERO',
    'ABOUT',
    'EXPERIENCE',
    'PROJECTS',
    'SKILLS',
    'TESTIMONIALS',
    'GALLERY',
    'CONTACT',
    'STATS',
    'CUSTOM_HTML',
  ]),
  title: z.string().optional(),
  content: z.record(z.unknown()).optional(),
});

const reorderSchema = z.object({
  sectionIds: z.array(z.string().cuid()),
});

// ── Helper — get owned portfolio ─────────────────────────────

async function getOwnedPortfolio(profileId: string) {
  return prisma.portfolio.findUnique({
    where: { profileId },
    include: {
      sections: { orderBy: { sortOrder: 'asc' } },
    },
  });
}

// ── Controllers ───────────────────────────────────────────────

/**
 * POST /portfolio
 * Creates a new portfolio for the authenticated premium user.
 * Pre-populates hero data from the user's existing profile.
 */
export async function createPortfolio(req: Request, res: Response): Promise<void> {
  try {
    const profileId = req.user!.profileId;

    if (!profileId) {
      sendError(res, 'You must complete your profile setup before creating a portfolio.', 400);
      return;
    }

    // Check if portfolio already exists
    const existing = await prisma.portfolio.findUnique({ where: { profileId } });
    if (existing) {
      sendError(res, 'Portfolio already exists. Use PATCH /portfolio to update it.', 409);
      return;
    }

    // Fetch profile data to pre-populate hero
    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { displayName: true, jobTitle: true, bio: true, email: true, phone: true },
    });

    // Create portfolio with default sections
    const portfolio = await prisma.portfolio.create({
      data: {
        profileId,
        headline: profile?.jobTitle ?? null,
        subheadline: profile?.bio?.substring(0, 200) ?? null,
        ctaText: 'Get in Touch',
        sections: {
          create: [
            {
              type: 'HERO',
              title: 'Hero',
              sortOrder: 0,
              content: { backgroundType: 'gradient', overlayOpacity: 0.6 },
            },
            {
              type: 'CONTACT',
              title: 'Contact',
              sortOrder: 1,
              content: { showEmail: true, showPhone: true, showForm: false },
            },
          ],
        },
      },
      include: {
        sections: { orderBy: { sortOrder: 'asc' } },
      },
    });

    sendSuccess(res, portfolio, 'Portfolio created successfully.', 201);
  } catch (error) {
    console.error('[createPortfolio]', error);
    sendError(res, 'Failed to create portfolio.');
  }
}

/**
 * GET /portfolio/me
 * Returns the authenticated user's portfolio (editor view).
 */
export async function getMyPortfolio(req: Request, res: Response): Promise<void> {
  try {
    const profileId = req.user!.profileId;

    if (!profileId) {
      sendError(res, 'Profile not found.', 404);
      return;
    }

    const portfolio = await getOwnedPortfolio(profileId);

    if (!portfolio) {
      sendError(res, 'No portfolio found. Create one first via POST /portfolio.', 404);
      return;
    }

    sendSuccess(res, portfolio);
  } catch (error) {
    console.error('[getMyPortfolio]', error);
    sendError(res, 'Failed to fetch portfolio.');
  }
}

/**
 * GET /portfolio/:username
 * Public route — fetches a published portfolio by username.
 * Increments viewCount on each fetch.
 */
export async function getPublicPortfolio(req: Request, res: Response): Promise<void> {
  try {
    const { username } = req.params;

    const profile = await prisma.profile.findUnique({
      where: { username },
      select: {
        id: true,
        displayName: true,
        jobTitle: true,
        email: true,
        phone: true,
        profilePicture: true,
        status: true,
        portfolio: {
          include: {
            sections: {
              where: { isVisible: true },
              orderBy: { sortOrder: 'asc' },
            },
          },
        },
      },
    });

    if (!profile) {
      sendError(res, 'Profile not found.', 404);
      return;
    }

    if (!profile.portfolio || !profile.portfolio.isPublished) {
      sendError(res, 'Portfolio not found or not published.', 404);
      return;
    }

    // Async view count increment (fire-and-forget)
    prisma.portfolio
      .update({
        where: { id: profile.portfolio.id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {});

    sendSuccess(res, {
      portfolio: profile.portfolio,
      profile: {
        displayName: profile.displayName,
        jobTitle: profile.jobTitle,
        email: profile.email,
        phone: profile.phone,
        profilePicture: profile.profilePicture,
      },
    });
  } catch (error) {
    console.error('[getPublicPortfolio]', error);
    sendError(res, 'Failed to fetch portfolio.');
  }
}

/**
 * PATCH /portfolio
 * Updates portfolio-level settings (theme, colors, hero fields, SEO).
 */
export async function updatePortfolio(req: Request, res: Response): Promise<void> {
  try {
    const profileId = req.user!.profileId;
    const parsed = portfolioUpdateSchema.safeParse(req.body);

    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(', '), 400);
      return;
    }

    const portfolio = await prisma.portfolio.update({
      where: { profileId },
      data: parsed.data,
      include: { sections: { orderBy: { sortOrder: 'asc' } } },
    });

    sendSuccess(res, portfolio, 'Portfolio updated.');
  } catch (error: any) {
    if (error?.code === 'P2025') {
      sendError(res, 'Portfolio not found. Create one first.', 404);
      return;
    }
    console.error('[updatePortfolio]', error);
    sendError(res, 'Failed to update portfolio.');
  }
}

/**
 * PATCH /portfolio/publish
 * Toggles the portfolio isPublished flag.
 */
export async function togglePublish(req: Request, res: Response): Promise<void> {
  try {
    const profileId = req.user!.profileId;

    const existing = await prisma.portfolio.findUnique({ where: { profileId } });
    if (!existing) {
      sendError(res, 'Portfolio not found.', 404);
      return;
    }

    const updated = await prisma.portfolio.update({
      where: { profileId },
      data: { isPublished: !existing.isPublished },
    });

    sendSuccess(
      res,
      updated,
      updated.isPublished ? 'Portfolio is now live!' : 'Portfolio has been unpublished.',
    );
  } catch (error) {
    console.error('[togglePublish]', error);
    sendError(res, 'Failed to toggle publish state.');
  }
}

/**
 * POST /portfolio/sections
 * Adds a new section to the portfolio.
 */
export async function addSection(req: Request, res: Response): Promise<void> {
  try {
    const profileId = req.user!.profileId;
    const parsed = addSectionSchema.safeParse(req.body);

    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(', '), 400);
      return;
    }

    const portfolio = await prisma.portfolio.findUnique({ where: { profileId } });
    if (!portfolio) {
      sendError(res, 'Portfolio not found.', 404);
      return;
    }

    // Validate content against type-specific schema if provided
    const { type, title, content } = parsed.data;
    const contentSchema = sectionContentSchemas[type];
    let validatedContent = content ?? {};

    if (content && contentSchema) {
      const contentParsed = contentSchema.safeParse(content);
      if (!contentParsed.success) {
        sendError(
          res,
          `Invalid content for section type ${type}: ${contentParsed.error.errors.map((e) => e.message).join(', ')}`,
          400,
        );
        return;
      }
      validatedContent = contentParsed.data as Record<string, unknown>;
    }

    // Get max sortOrder
    const maxOrder = await prisma.portfolioSection.aggregate({
      where: { portfolioId: portfolio.id },
      _max: { sortOrder: true },
    });

    const section = await prisma.portfolioSection.create({
      data: {
        portfolioId: portfolio.id,
        type,
        title: title ?? type.charAt(0) + type.slice(1).toLowerCase(),
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content: validatedContent as any,
      },
    });

    sendSuccess(res, section, 'Section added.', 201);
  } catch (error) {
    console.error('[addSection]', error);
    sendError(res, 'Failed to add section.');
  }
}

/**
 * PATCH /portfolio/sections/:sectionId
 * Updates the content, title, or visibility of a specific section.
 */
export async function updateSection(req: Request, res: Response): Promise<void> {
  try {
    const profileId = req.user!.profileId;
    const { sectionId } = req.params;

    // Ownership check via join
    const section = await prisma.portfolioSection.findFirst({
      where: { id: sectionId, portfolio: { profileId } },
    });

    if (!section) {
      sendError(res, 'Section not found or access denied.', 404);
      return;
    }

    const { title, isVisible, content } = req.body;

    // Validate content if provided
    let validatedContent = content;
    if (content !== undefined) {
      const contentSchema = sectionContentSchemas[section.type as keyof typeof sectionContentSchemas];
      if (contentSchema) {
        const parsed = contentSchema.safeParse(content);
        if (!parsed.success) {
          sendError(
            res,
            `Invalid content: ${parsed.error.errors.map((e) => e.message).join(', ')}`,
            400,
          );
          return;
        }
        validatedContent = parsed.data;
      }
    }

    const updated = await prisma.portfolioSection.update({
      where: { id: sectionId },
      data: {
        ...(title !== undefined && { title }),
        ...(isVisible !== undefined && { isVisible }),
        ...(validatedContent !== undefined && { content: validatedContent }),
      },
    });

    sendSuccess(res, updated, 'Section updated.');
  } catch (error) {
    console.error('[updateSection]', error);
    sendError(res, 'Failed to update section.');
  }
}

/**
 * DELETE /portfolio/sections/:sectionId
 * Removes a section from the portfolio.
 */
export async function deleteSection(req: Request, res: Response): Promise<void> {
  try {
    const profileId = req.user!.profileId;
    const { sectionId } = req.params;

    // Ownership check
    const section = await prisma.portfolioSection.findFirst({
      where: { id: sectionId, portfolio: { profileId } },
    });

    if (!section) {
      sendError(res, 'Section not found or access denied.', 404);
      return;
    }

    // Prevent deleting the last HERO section
    if (section.type === 'HERO') {
      const heroCount = await prisma.portfolioSection.count({
        where: { portfolioId: section.portfolioId, type: 'HERO' },
      });
      if (heroCount <= 1) {
        sendError(res, 'Cannot delete the last Hero section.', 400);
        return;
      }
    }

    await prisma.portfolioSection.delete({ where: { id: sectionId } });

    sendSuccess(res, { id: sectionId }, 'Section deleted.');
  } catch (error) {
    console.error('[deleteSection]', error);
    sendError(res, 'Failed to delete section.');
  }
}

/**
 * PATCH /portfolio/sections/reorder
 * Bulk-updates sortOrder for all sections.
 * Body: { sectionIds: string[] } — ordered from top to bottom.
 */
export async function reorderSections(req: Request, res: Response): Promise<void> {
  try {
    const profileId = req.user!.profileId;
    const parsed = reorderSchema.safeParse(req.body);

    if (!parsed.success) {
      sendError(res, parsed.error.errors.map((e) => e.message).join(', '), 400);
      return;
    }

    const portfolio = await prisma.portfolio.findUnique({ where: { profileId } });
    if (!portfolio) {
      sendError(res, 'Portfolio not found.', 404);
      return;
    }

    // Bulk update sortOrder
    await prisma.$transaction(
      parsed.data.sectionIds.map((id, index) =>
        prisma.portfolioSection.updateMany({
          where: { id, portfolioId: portfolio.id },
          data: { sortOrder: index },
        }),
      ),
    );

    sendSuccess(res, null, 'Sections reordered.');
  } catch (error) {
    console.error('[reorderSections]', error);
    sendError(res, 'Failed to reorder sections.');
  }
}

/**
 * POST /portfolio/upload
 * Handles portfolio image uploads (hero, project, gallery images).
 * Returns the file URL for use in section content.
 */
export async function uploadPortfolioImage(req: Request, res: Response): Promise<void> {
  try {
    if (!req.file) {
      sendError(res, 'No image file provided.', 400);
      return;
    }

    const API_URL = process.env.API_URL ?? 'http://localhost:4000';
    const fileUrl = `${API_URL}/uploads/${req.file.filename}`;

    sendSuccess(res, { url: fileUrl }, 'Image uploaded successfully.');
  } catch (error) {
    console.error('[uploadPortfolioImage]', error);
    sendError(res, 'Failed to upload image.');
  }
}
