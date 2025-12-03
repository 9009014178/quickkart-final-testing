const express = require('express');
const router = express.Router();
// Import both body and param for validation
const { body, param } = require('express-validator');
const {
  // User functions
  getUserProfile,
  updateUserProfile,
  changePassword, // <<< ADDED: Import changePassword
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  quickReorder,
  registerDeviceForPush,
  // Admin functions
  getUsers,
  getUserById,
  deleteUser,
  updateUser,
  getDeliveryPartners,
} = require('../controllers/userController.js');
const { protect, isAdmin } = require('../middlewares/authMiddleware.js');

// --- Validation Rules ---
const addressValidationRules = [
  body('addressLine1', 'Address Line 1 is required').not().isEmpty().trim().escape(),
  body('city', 'City is required').not().isEmpty().trim().escape(),
  body('pincode', 'Pincode is required').not().isEmpty().isPostalCode('IN').withMessage('Invalid Indian Pincode'),
  body('state', 'State is required').not().isEmpty().trim().escape(),
  body('addressLine2').optional().trim().escape(),
  body('isDefault').optional().isBoolean(), // Added validation for isDefault
];

const adminUpdateUserValidationRules = [
    body('name', 'Name is required').optional().not().isEmpty().trim().escape(),
    body('email', 'Please include a valid email').optional().isEmail().normalizeEmail(),
    body('role', 'Invalid role specified').optional().isIn(['customer', 'delivery_partner', 'admin'])
];

const profileUpdateValidationRules = [
    body('name', 'Name cannot be empty').optional().not().isEmpty().trim().escape(),
    body('email', 'Please include a valid email').optional().isEmail().normalizeEmail(),
    body('phone', 'Phone number must be exactly 10 digits')
        .optional({ checkFalsy: true })
        .isNumeric({ no_symbols: true })
        .isLength({ min: 10, max: 10 }),
    // Removed password validation here - handled separately
    body('allowEmailPromotions').optional().isBoolean(),
    body('allowSmsNotifications').optional().isBoolean(),
];

// <<< ADDED: Validation rules for changing password >>>
const changePasswordValidationRules = [
    body('currentPassword', 'Current password is required').not().isEmpty(),
    body('newPassword', 'New password must be at least 6 characters').isLength({ min: 6 }),
];

const fcmTokenValidation = [
    body('fcmToken', 'A valid FCM token is required').not().isEmpty().isString().trim(),
];

const mongoIdParamValidation = (paramName) => [
    param(paramName, `Valid ${paramName} is required`).isMongoId()
];
// --- End Validation Rules ---


// --- User Routes ---
router.route('/profile')
    .get(protect, getUserProfile)
    .put(protect, profileUpdateValidationRules, updateUserProfile);

// <<< ADDED: Route for changing password >>>
router.route('/profile/password')
    .put(protect, changePasswordValidationRules, changePassword);

router.route('/addresses')
    .get(protect, getAddresses)
    .post(protect, addressValidationRules, addAddress);

router.route('/addresses/:id')
    .put(protect, [...mongoIdParamValidation('id'), ...addressValidationRules], updateAddress) // Route for updating address
    .delete(protect, mongoIdParamValidation('id'), deleteAddress);

router.route('/reorder/:orderId')
    .post(protect, mongoIdParamValidation('orderId'), quickReorder);

router.route('/register-device').put(protect, fcmTokenValidation, registerDeviceForPush);


// --- Admin Routes ---
router.route('/').get(protect, isAdmin, getUsers);
router.route('/delivery-partners').get(protect, isAdmin, getDeliveryPartners);

router.route('/:id')
    .get(protect, isAdmin, mongoIdParamValidation('id'), getUserById)
    .delete(protect, isAdmin, mongoIdParamValidation('id'), deleteUser)
    .put(protect, isAdmin, [...mongoIdParamValidation('id'), ...adminUpdateUserValidationRules], updateUser);

module.exports = router;