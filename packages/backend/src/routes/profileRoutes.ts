// ============================================================
//  NEXUS — Profile Routes
//  Order of middleware matters:
//  Public routes first, then protected routes.
// ============================================================

import { Router } from 'express';
import {
  getPublicProfile,
  downloadVCard,
  instantUpdate,
  moderatedUpdate,
  togglePrivacy,
  getMyProfile,
  getProfileAnalytics,
} from '../controllers/profileController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { uploadFields } from '../middlewares/uploadMiddleware';
import { moderationMiddleware } from '../middlewares/moderationMiddleware';

export const profileRouter = Router();

// ── Public Routes (no auth required) ─────────────────────────

/** GET /api/v1/profile/me — Protected (must come before :username to avoid collision) */
profileRouter.get('/me', authMiddleware, getMyProfile);

/** GET /api/v1/profile/analytics — Protected analytics endpoint (must come before :username) */
profileRouter.get('/analytics', authMiddleware, getProfileAnalytics);

/** GET /api/v1/profile/:username — Public profile fetch */
profileRouter.get('/:username', getPublicProfile);

/** GET /api/v1/profile/:username/vcard — VCF file download */
profileRouter.get('/:username/vcard', downloadVCard);

// ── Protected Routes (auth required) ─────────────────────────

/** PATCH /api/v1/profile/instant — Update bio, phone, etc. immediately */
profileRouter.patch('/instant', authMiddleware, instantUpdate);

/**
 * PATCH /api/v1/profile/moderated
 * Upload pipeline: multer → AI moderation → controller
 * Handles displayName, profilePicture, companyLogo with VerificationRequest injection.
 */
profileRouter.patch(
  '/moderated',
  authMiddleware,
  uploadFields,
  moderationMiddleware('profilePicture'),
  moderatedUpdate,
);

/** PATCH /api/v1/profile/privacy — Toggle STEALTH mode */
profileRouter.patch('/privacy', authMiddleware, togglePrivacy);
