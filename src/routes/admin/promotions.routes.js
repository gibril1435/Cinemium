const express = require('express');
const router = express.Router();
const promotionController = require('../../controllers/promotionController');
const { isAdmin } = require('../../middleware/auth');

// Admin Promotion Management
router.get('/', isAdmin, promotionController.getAllPromotions);
router.post('/', isAdmin, promotionController.createPromotion);
router.put('/:id', isAdmin, promotionController.updatePromotion);
router.delete('/:id', isAdmin, promotionController.deletePromotion);

module.exports = router; 