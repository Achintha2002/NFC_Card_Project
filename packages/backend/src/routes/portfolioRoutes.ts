// ============================================================
//  TAGIT — Portfolio Routes
//  Mounts all portfolio endpoints with appropriate auth guards.
// ============================================================

import { Router } from 'express';
import { authMiddleware } from '../middlewares/authMiddleware';
import { premiumGuard } from '../middlewares/premiumGuard';
import { uploadSingle } from '../middlewares/uploadMiddleware';
import {
  createPortfolio,
  getMyPortfolio,
  getPublicPortfolio,
  updatePortfolio,
  togglePublish,
  addSection,
  updateSection,
  deleteSection,
  reorderSections,
  uploadPortfolioImage,
} from '../controllers/portfolioController';

export const portfolioRouter = Router();

// ── Protected Routes (authenticated users) ───────────────────

/** GET /portfolio/me — Fetch own portfolio for editor */
portfolioRouter.get('/me', authMiddleware, getMyPortfolio);

// ── Premium-only Routes ──────────────────────────────────────

/** POST /portfolio — Create portfolio (PREMIUM/CORPORATE only) */
portfolioRouter.post('/', authMiddleware, premiumGuard, createPortfolio);

/** POST /portfolio/sections — Add a new section (PREMIUM/CORPORATE only) */
portfolioRouter.post('/sections', authMiddleware, premiumGuard, addSection);

/** POST /portfolio/upload — Upload image for portfolio use */
portfolioRouter.post('/upload', authMiddleware, uploadSingle, uploadPortfolioImage);

// ── Protected Patch/Delete Routes (authenticated users) ───────

/** PATCH /portfolio — Update portfolio settings */
portfolioRouter.patch('/', authMiddleware, updatePortfolio);

/** PATCH /portfolio/publish — Toggle publish/unpublish */
portfolioRouter.patch('/publish', authMiddleware, togglePublish);

/** PATCH /portfolio/sections/reorder — Bulk reorder (must be before /:sectionId routes) */
portfolioRouter.patch('/sections/reorder', authMiddleware, reorderSections);

/** PATCH /portfolio/sections/:sectionId — Update section content */
portfolioRouter.patch('/sections/:sectionId', authMiddleware, updateSection);

/** DELETE /portfolio/sections/:sectionId — Remove a section */
portfolioRouter.delete('/sections/:sectionId', authMiddleware, deleteSection);

// ── Public Routes ────────────────────────────────────────────

/** GET /portfolio/:username — Public portfolio viewer (NFC tap destination) */
portfolioRouter.get('/:username', getPublicPortfolio);
