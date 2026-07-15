// ============================================================
//  NEXUS — Link Routes
// ============================================================

import { Router } from 'express';
import {
  getLinks,
  createLink,
  updateLink,
  toggleLink,
  deleteLink,
  reorderLinks,
  recordLinkClick,
} from '../controllers/linkController';
import { authMiddleware } from '../middlewares/authMiddleware';
import rateLimit from 'express-rate-limit';

export const linkRouter = Router();

const clickRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute window
  max: 30, // Limit each IP to 30 link clicks per minute
  message: { success: false, error: 'Too many clicks recorded from this IP. Please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false,
});

/** POST /api/v1/links/:id/click — Public rate-limited link click tracking (must come before authMiddleware) */
linkRouter.post('/:id/click', clickRateLimiter, recordLinkClick);

// All subsequent link routes require authentication
linkRouter.use(authMiddleware);

/** GET /api/v1/links — Fetch all profile links */
linkRouter.get('/', getLinks);

/** POST /api/v1/links — Add a new link */
linkRouter.post('/', createLink);

/** PATCH /api/v1/links/reorder — Batch reorder (must precede /:id) */
linkRouter.patch('/reorder', reorderLinks);

/** PATCH /api/v1/links/:id — Update link properties */
linkRouter.patch('/:id', updateLink);

/** PATCH /api/v1/links/:id/toggle — Toggle isActive */
linkRouter.patch('/:id/toggle', toggleLink);

/** DELETE /api/v1/links/:id — Delete a link */
linkRouter.delete('/:id', deleteLink);
