const asyncHandler = require('express-async-handler');
const Order = require('../models/orderModel.js');
const User = require('../models/userModel.js');
const Product = require('../models/productModel.js');
const Settings = require('../models/settingsModel.js'); // Import Settings
const DarkStore = require('../models/darkStoreModel.js'); // Import DarkStore

/**
 * @desc    Get sales summary for admin dashboard
 * @route   GET /api/dashboard/summary
 * @access  Private/Admin
 */
const getAdminDashboardSummary = asyncHandler(async (req, res) => {
    const numOrders = await Order.countDocuments({});
    const salesData = await Order.aggregate([
        { $match: { orderStatus: 'Delivered' } },
        { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
    ]);
    const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;
    const numUsers = await User.countDocuments({});
    const numProducts = await Product.countDocuments({ isAvailable: true });

    res.json({
        totalUsers: numUsers,
        totalProducts: numProducts,
        totalOrders: numOrders,
        totalSales: parseFloat(totalSales.toFixed(2)),
    });
});

/**
 * @desc    Get sales report grouped by day
 * @route   GET /api/dashboard/sales-report
 * @access  Private/Admin
 */
const getSalesReport = asyncHandler(async (req, res) => {
    const salesByDay = await Order.aggregate([
        { $match: { orderStatus: 'Delivered' } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, totalSales: { $sum: "$totalPrice" }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
    res.json(salesByDay);
});

/**
 * @desc    Get most popular products based on quantity sold
 * @route   GET /api/dashboard/popular-products
 * @access  Private/Admin
 */
const getPopularProducts = asyncHandler(async (req, res) => {
    const popularProducts = await Order.aggregate([
        { $match: { orderStatus: 'Delivered' } },
        { $unwind: '$orderItems' },
        { $group: { _id: '$orderItems.product', name: { $first: '$orderItems.name' }, totalQuantitySold: { $sum: '$orderItems.qty' } } },
        { $sort: { totalQuantitySold: -1 } },
        { $limit: 10 }
    ]);
    res.json(popularProducts);
});

/**
 * @desc    Get order count by status
 * @route   GET /api/dashboard/delivery-report
 * @access  Private/Admin
 */
const getDeliveryReport = asyncHandler(async (req, res) => {
    const orderStatusCounts = await Order.aggregate([
        { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
    ]);
    const report = orderStatusCounts.reduce((acc, status) => {
        acc[status._id] = status.count;
        return acc;
    }, {});
    res.json(report);
});

/**
 * @desc    Get delivery partner performance report
 * @route   GET /api/dashboard/partner-performance
 * @access  Private/Admin
 */
const getDeliveryPartnerPerformance = asyncHandler(async (req, res) => {
    const performance = await Order.aggregate([
        { $match: { deliveryPartner: { $exists: true, $ne: null }, orderStatus: 'Delivered' } },
        { $group: { _id: '$deliveryPartner', totalDeliveries: { $sum: 1 }, averageRating: { $avg: '$deliveryRating' } } },
        { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'partnerDetails' } },
        { $unwind: '$partnerDetails' },
        { $project: { _id: 0, partnerId: '$_id', name: '$partnerDetails.name', email: '$partnerDetails.email', phone: '$partnerDetails.phone', totalDeliveries: 1, averageRating: { $ifNull: [ { $round: ['$averageRating', 1] }, 'N/A' ] } } },
        { $sort: { totalDeliveries: -1 } }
    ]);
    res.json(performance);
});

/**
 * @desc    Get stats about abandoned carts
 * @route   GET /api/dashboard/abandoned-carts
 * @access  Private/Admin
 */
const getAbandonedCartStats = asyncHandler(async (req, res) => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const abandonedCartCount = await User.countDocuments({
        'cart.0': { $exists: true },
        lastCartUpdate: { $lt: twentyFourHoursAgo }
    });
    res.json({ abandonedCartCount: abandonedCartCount });
});

/**
 * @desc    Get recently active users report
 * @route   GET /api/dashboard/active-users
 * @access  Private/Admin
 */
const getActiveUsersReport = asyncHandler(async (req, res) => {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentLogins = await User.find({ lastLogin: { $gte: sevenDaysAgo } }).select('name email lastLogin role').sort({ lastLogin: -1 });
    const recentOrderUsers = await Order.distinct('user', { createdAt: { $gte: sevenDaysAgo } });
    const recentLoginUserIds = recentLogins.map(u => u._id.toString());
    const orderUsersToFetch = recentOrderUsers.filter(id => !recentLoginUserIds.includes(id.toString()));
    const usersWithRecentOrders = await User.find({ _id: { $in: orderUsersToFetch } }).select('name email role');

    res.json({
        recentLogins: recentLogins,
        usersWithRecentOrders: usersWithRecentOrders,
        activeUserLoginCount: recentLogins.length,
        activeUserOrderCount: recentOrderUsers.length,
    });
});

/**
 * @desc    Get products that are low in stock (Zonal Inventory)
 * @route   GET /api/dashboard/low-stock
 * @access  Private/Admin
 */
const getLowStockReport = asyncHandler(async (req, res) => {
    // 1. Get the threshold from settings
    const settings = await Settings.findOneAndUpdate(
        { siteIdentifier: 'quickkart_settings' },
        { $setOnInsert: { siteIdentifier: 'quickkart_settings' } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const threshold = settings.lowStockThreshold;

    // 2. Find products with low stock in *any* store
    const lowStockProducts = await Product.aggregate([
        { $match: { isAvailable: true } }, // Only check available products
        { $unwind: '$inventory' }, // Deconstruct the inventory array
        { $match: { 'inventory.stock': { $lte: threshold } } }, // Find entries at or below threshold
        { $lookup: { from: 'darkstores', localField: 'inventory.store', foreignField: '_id', as: 'storeDetails' } }, // Get store info
        { $unwind: '$storeDetails' },
        { 
            $project: {
                _id: 0,
                productId: '$_id',
                name: '$name',
                category: '$category',
                storeName: '$storeDetails.name',
                pincode: '$storeDetails.pincode',
                stock: '$inventory.stock'
            }
        },
        { $sort: { stock: 1 } } // Sort by lowest stock first
    ]);

    res.json({
        threshold: threshold,
        productCount: lowStockProducts.length,
        products: lowStockProducts,
    });
});

/**
 * @desc    Get inventory report for all dark stores
 * @route   GET /api/dashboard/store-inventory
 * @access  Private/Admin
 */
const getStoreInventoryReport = asyncHandler(async (req, res) => {
    const products = await Product.find({})
        .populate('inventory.store', 'name pincode')
        .select('name inventory');

    const storeInventoryReport = {};

    products.forEach(product => {
        product.inventory.forEach(inv => {
            if (inv.store) { // Check if store exists (wasn't deleted)
                const storeName = `${inv.store.name} (${inv.store.pincode})`;
                if (!storeInventoryReport[storeName]) {
                    storeInventoryReport[storeName] = {
                        storeId: inv.store._id,
                        products: []
                    };
                }
                storeInventoryReport[storeName].products.push({
                    productId: product._id,
                    productName: product.name,
                    stock: inv.stock
                });
            }
        });
    });

    res.json(storeInventoryReport);
});

// ## FINAL EXPORTS ##
module.exports = {
    getAdminDashboardSummary,
    getSalesReport,
    getPopularProducts,
    getDeliveryReport,
    getDeliveryPartnerPerformance,
    getAbandonedCartStats,
    getActiveUsersReport,
    getLowStockReport,
    getStoreInventoryReport, // Added this function
};