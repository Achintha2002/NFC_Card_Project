// ============================================================
//  TAGIT — Lead Routes
//  Public submission + protected management endpoints.
// ============================================================

import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import {
  submitLead,
  getMyLeads,
  deleteLead,
  toggleLeadCapture,
} from '../controllers/leadController';

export const leadRouter = Router();

// ── Public Routes ─────────────────────────────────────────────

/**
 * POST /api/v1/leads/submit/:username
 * Public. Called by the scanner's browser when lead capture form is submitted.
 */
leadRouter.post('/submit/:username', submitLead);

// ── Protected Routes ──────────────────────────────────────────

/**
 * GET /api/v1/leads
 * Protected. Returns all leads captured for the authenticated user's profile.
 */
leadRouter.get('/', authMiddleware, getMyLeads);

/**
 * DELETE /api/v1/leads/:id
 * Protected. Deletes a specific lead owned by the authenticated user.
 */
leadRouter.delete('/:id', authMiddleware, deleteLead);

/**
 * PATCH /api/v1/leads/capture-toggle
 * Protected. Toggles lead capture mode on/off.
 */
leadRouter.patch('/capture-toggle', authMiddleware, toggleLeadCapture);
