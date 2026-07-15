// ============================================================
//  TAGIT — Lead Capture Controller
//  Handles contact exchange submissions from NFC profile pages
// ============================================================

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

/**
 * POST /api/v1/leads
 * Public endpoint for visitors tapping a card to submit their contact info.
 */
export async function createLead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const { profileId, username, name, email, phone, company, notes } = req.body;

    if (!name || (!email && !phone)) {
      res.status(400).json({
        success: false,
        error: 'Name and at least one contact method (Email or Phone) are required',
      });
      return;
    }

    let targetProfileId = profileId;
    if (!targetProfileId && username) {
      const profile = await prisma.profile.findUnique({ where: { username } });
      if (profile) {
        targetProfileId = profile.id;
      }
    }

    if (!targetProfileId) {
      res.status(400).json({ success: false, error: 'Target profile not specified or found' });
      return;
    }

    const lead = await prisma.lead.create({
      data: {
        profileId: targetProfileId,
        name: name.trim(),
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        company: company?.trim() || null,
        notes: notes?.trim() || null,
      },
    });

    res.status(201).json({
      success: true,
      data: lead,
      message: 'Contact information exchanged successfully!',
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * GET /api/v1/leads/my-profile
 * Protected endpoint for the card owner to view captured leads.
 * Query param: ?profileId=... (optional, defaults to primary/default profile)
 */
export async function getMyLeads(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const { profileId } = req.query;

    let targetProfileId: string | undefined;

    if (profileId && typeof profileId === 'string') {
      // Verify ownership
      const profile = await prisma.profile.findUnique({ where: { id: profileId } });
      if (profile && profile.userId === userId) {
        targetProfileId = profile.id;
      }
    }

    if (!targetProfileId) {
      // Find user's default or first profile
      const userProfiles = await prisma.profile.findMany({
        where: { userId },
        orderBy: { isDefault: 'desc' },
      });
      if (userProfiles.length > 0) {
        targetProfileId = userProfiles[0].id;
      }
    }

    if (!targetProfileId) {
      res.status(404).json({ success: false, error: 'No profile found for user' });
      return;
    }

    const leads = await prisma.lead.findMany({
      where: { profileId: targetProfileId },
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json({
      success: true,
      data: leads,
      count: leads.length,
    });
  } catch (error: any) {
    next(error);
  }
}

/**
 * DELETE /api/v1/leads/:id
 * Protected endpoint to delete a lead record.
 */
export async function deleteLead(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const leadId = req.params.id;
    const lead = await prisma.lead.findUnique({
      where: { id: leadId },
      include: { profile: true },
    });

    if (!lead || lead.profile.userId !== userId) {
      res.status(404).json({ success: false, error: 'Lead not found or unauthorized' });
      return;
    }

    await prisma.lead.delete({ where: { id: leadId } });

    res.status(200).json({ success: true, message: 'Lead deleted successfully' });
  } catch (error: any) {
    next(error);
  }
}
