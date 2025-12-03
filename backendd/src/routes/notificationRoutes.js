const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { sendPromotionalNotification } = require('../controllers/notificationController.js');
const { protect } = require('../middlewares/authMiddleware.js');
const { admin } = require('../middlewares/adminMiddleware.js');

// Validation rules for sending a promotion
const promoValidationRules = [
    body('subject', 'Email subject is required for type Email or All').if(body('type').isIn(['Email', 'All'])).not().isEmpty(),
    body('message', 'Message is required').not().isEmpty(),
    body('type', 'Type must be Email, SMS, or All').isIn(['Email', 'SMS', 'All']),
];

// Admin route for sending promotions
router.route('/promo').post(protect, admin, promoValidationRules, sendPromotionalNotification);

module.exports = router;