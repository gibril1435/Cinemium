const express = require('express');
const router = express.Router();
const promotionController = require('../../controllers/promotionController');
const { isAdmin } = require('../../middleware/auth');

/**
 * @swagger
 * tags:
 *   - name: AdminPromotions
 *     description: Promotion management (admin only)
 * /api/admin/promotions:
 *   get:
 *     summary: Get all promotions (admin)
 *     tags: [AdminPromotions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of promotions
 *       401:
 *         description: Unauthorized
 */

// Admin Promotion Management
router.get('/', isAdmin, promotionController.getAllPromotions);
router.post('/', isAdmin, promotionController.createPromotion);
router.put('/:id', isAdmin, promotionController.updatePromotion);
router.delete('/:id', isAdmin, promotionController.deletePromotion);

module.exports = router; 