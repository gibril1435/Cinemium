const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotionController');
const { isAdmin } = require('../middleware/auth');

// Customer routes
router.get('/', promotionController.getActivePromotions);
router.get('/:id', promotionController.getPromotionById);

// Admin routes
router.get('/admin/all', isAdmin, promotionController.getAllPromotions);
router.post('/admin', isAdmin, promotionController.createPromotion);
router.put('/admin/:id', isAdmin, promotionController.updatePromotion);
router.delete('/admin/:id', isAdmin, promotionController.deletePromotion);

module.exports = router; 