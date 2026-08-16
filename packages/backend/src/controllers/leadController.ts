// ============================================================
//  TAGIT — Lead Controller
//  Handles Lead Capture: public lead submission and
//  authenticated user's lead management (list, delete).
// ============================================================

import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/database';
import { sendSuccess, sendError } from '../utils/responseHelper';
import { AppError } from '../middlewares/errorMiddleware';

// ── Validation Schemas ────────────────────────────────────────

const submitLeadSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(30).optional(),
  company: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
});

// ============================================================
//  POST /api/v1/leads/submit/:username
//  PUBLIC — No auth required.
//  Submits a lead for a profile (called by the profile's public page).
// ============================================================

export async function submitLead(req: Request, res: Response): Promise<void> {
  try {
    const { username } = req.params;

    // Find the profile and check lead capture is enabled
    const profile = await prisma.profile.findUnique({
      where: { username },
      select: { id: true, leadCaptureEnabled: true, status: true },
    });

    if (!profile || profile.status !== 'ACTIVE') {
      throw new AppError('Profile not found or unavailable.', 404);
    }

    if (!profile.leadCaptureEnabled) {
      throw new AppError('Lead capture is not enabled for this profile.', 403);
    }

    const body = submitLeadSchema.parse(req.body);

    // Gather optional device context from request
    const ipAddress = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim()
      ?? req.socket.remoteAddress
      ?? undefined;
    const userAgent = req.headers['user-agent'] ?? '';
    const deviceType = /mobile|android|iphone|ipad/i.test(userAgent) ? 'MOBILE' : 'DESKTOP';

    const lead = await prisma.lead.create({
      data: {
        profileId: profile.id,
        name: body.name,
        email: body.email || undefined,
        phone: body.phone,
        company: body.company,
        message: body.message,
        deviceType,
        ipAddress,
      },
    });

    sendSuccess(res, { id: lead.id }, 'Contact information submitted successfully.', 201);
  } catch (error) {
    if (error instanceof z.ZodError) {
      sendError(res, `Validation error: ${error.errors.map(e => e.message).join(', ')}`, 400);
      return;
    }
    console.error('submitLead error:', error);
    if (error instanceof AppError) {
      sendError(res, error.message, error.statusCode);
      return;
    }
    sendError(res, 'Failed to submit lead.', 500);
  }
}

// ============================================================
//  GET /api/v1/leads
//  PROTECTED — Returns all leads for the authenticated user's profile.
// ============================================================

export async function getMyLeads(req: Request, res: Response): Promise<void> {
  try {
    const { profileId } = req.user!;
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(50, Math.max(1, Number(req.query.limit ?? 20)));
    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where: { profileId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.lead.count({ where: { profileId } }),
    ]);

    sendSuccess(res, {
      leads,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('getMyLeads error:', error);
    sendError(res, 'Failed to fetch leads.', 500);
  }
}

// ============================================================
//  DELETE /api/v1/leads/:id
//  PROTECTED — Deletes a specific lead (must belong to the user's profile).
// ============================================================

export async function deleteLead(req: Request, res: Response): Promise<void> {
  try {
    const { profileId } = req.user!;
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({ where: { id }, select: { profileId: true } });

    if (!lead) {
      sendError(res, 'Lead not found.', 404);
      return;
    }

    if (lead.profileId !== profileId) {
      sendError(res, 'You do not have permission to delete this lead.', 403);
      return;
    }

    await prisma.lead.delete({ where: { id } });
    sendSuccess(res, null, 'Lead deleted successfully.');
  } catch (error) {
    console.error('deleteLead error:', error);
    sendError(res, 'Failed to delete lead.', 500);
  }
}

// ============================================================
//  PATCH /api/v1/leads/capture-toggle
//  PROTECTED — Toggle lead capture mode on/off for the profile.
// ============================================================

export async function toggleLeadCapture(req: Request, res: Response): Promise<void> {
  try {
    const { profileId } = req.user!;

    const profile = await prisma.profile.findUnique({
      where: { id: profileId },
      select: { leadCaptureEnabled: true },
    });

    if (!profile) {
      sendError(res, 'Profile not found.', 404);
      return;
    }

    const updated = await prisma.profile.update({
      where: { id: profileId },
      data: { leadCaptureEnabled: !profile.leadCaptureEnabled },
      select: { id: true, leadCaptureEnabled: true },
    });

    sendSuccess(
      res,
      updated,
      `Lead Capture Mode is now ${updated.leadCaptureEnabled ? '✅ Enabled' : '🔕 Disabled'}`,
    );
  } catch (error) {
    console.error('toggleLeadCapture error:', error);
    sendError(res, 'Failed to toggle lead capture mode.', 500);
  }
}
