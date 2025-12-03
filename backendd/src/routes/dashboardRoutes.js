const express = require('express');
const router = express.Router();
const {
    getAdminDashboardSummary,
    getSalesReport,
    getPopularProducts,
    getDeliveryReport,
    getDeliveryPartnerPerformance,
    getAbandonedCartStats,
    getActiveUsersReport,
    getLowStockReport,
    getStoreInventoryReport // 1. Yeh function import karo
} = require('../controllers/dashboardController.js');
const { protect } = require('../middlewares/authMiddleware.js');
const { admin } = require('../middlewares/adminMiddleware.js');

router.route('/summary').get(protect, admin, getAdminDashboardSummary);
router.route('/sales-report').get(protect, admin, getSalesReport);
router.route('/popular-products').get(protect, admin, getPopularProducts);
router.route('/delivery-report').get(protect, admin, getDeliveryReport);
router.route('/partner-performance').get(protect, admin, getDeliveryPartnerPerformance);
router.route('/abandoned-carts').get(protect, admin, getAbandonedCartStats);
router.route('/active-users').get(protect, admin, getActiveUsersReport);
router.route('/low-stock').get(protect, admin, getLowStockReport);
router.route('/store-inventory').get(protect, admin, getStoreInventoryReport); // 2. Yeh naya route add karo

module.exports = router;