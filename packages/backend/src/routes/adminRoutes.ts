// ============================================================
//  TAGIT — Admin API Routes
//  All endpoints protected by `requireAdmin` middleware.
// ============================================================

import { Router } from 'express';
import { requireAdmin } from '../middlewares/adminAuth';
import * as adminController from '../controllers/adminController';

const router = Router();

// Protect all admin endpoints
router.use(requireAdmin);

// 1. Executive Analytics
router.get('/analytics', adminController.getAnalytics);

// 2. NFC Card Inventory & SKUs
router.get('/inventory', adminController.getInventory);
router.post('/inventory', adminController.upsertProduct);
router.delete('/inventory/:id', adminController.deleteProduct);

// 3. TAGIT Card Provisioning & NFC Batch Encoder
router.get('/cards', adminController.getNfcCards);
router.post('/cards/batch', adminController.createNfcCardBatch);
router.post('/cards/assign', adminController.assignNfcCard);
router.post('/cards/bulk-provision', adminController.bulkProvisionNfcCards);

// 4. E-Commerce Orders & Fulfillment Pipeline
router.get('/orders', adminController.getOrders);
router.patch('/orders/:id', adminController.updateOrderStatus);

// 5. Customer CRM & Role Management
router.get('/users', adminController.getUsers);
router.post('/users', adminController.createAdminUser);
router.patch('/users/:id', adminController.updateUserRoleTier);

// 6. Profile Moderation Queue
router.get('/verifications', adminController.getVerifications);
router.patch('/verifications/bulk-moderate', adminController.bulkModerateVerifications);
router.patch('/verifications/:id', adminController.moderateVerification);

export default router;
