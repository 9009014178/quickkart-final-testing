const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const { createStore, getStores, deleteStore } = require('../controllers/darkStoreController.js');
const { protect } = require('../middlewares/authMiddleware.js');
const { admin } = require('../middlewares/adminMiddleware.js');

// Validation rules for creating a store
const storeValidationRules = [
    body('name', 'Store name is required').not().isEmpty().trim().escape(),
    body('pincode', 'Valid Indian Pincode is required').isPostalCode('IN'),
    body('address', 'Address is required').not().isEmpty().trim().escape(),
    body('latitude', 'Valid latitude is required').isFloat({ min: -90, max: 90 }),
    body('longitude', 'Valid longitude is required').isFloat({ min: -180, max: 180 }),
];

// Admin routes for managing stores
router.route('/')
    .post(protect, admin, storeValidationRules, createStore)
    .get(protect, admin, getStores);

router.route('/:id')
    .delete(protect, admin, [param('id', 'Valid Store ID required').isMongoId()], deleteStore);

module.exports = router;