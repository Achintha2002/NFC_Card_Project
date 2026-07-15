// ============================================================
//  TAGIT — Lead Capture Routes
// ============================================================

import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  createLead,
  getMyLeads,
  deleteLead,
} from '../controllers/leadController';

export const leadRouter = Router();

/**
 * POST /api/v1/leads
 * Public endpoint to submit contact info from public profile pages.
 */
leadRouter.post('/', createLead);

/**
 * GET /api/v1/leads/my-profile
 * Protected endpoint for card owners to view their leads.
 */
leadRouter.get('/my-profile', authMiddleware, getMyLeads);

/**
 * DELETE /api/v1/leads/:id
 * Protected endpoint to delete a lead.
 */
leadRouter.delete('/:id', authMiddleware, deleteLead);
