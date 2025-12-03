
const dotenv = require('dotenv');
dotenv.config(); // Load environment variables at the very top

const app = require('./src/app'); // Import your Express app
const connectDB = require('./src/config/db'); // Import DB connection function
const cron = require('node-cron'); // Import node-cron for scheduling
const logger = require('./src/utils/logger'); // Import the Winston logger

// Import all necessary models for cron jobs
const User = require('./src/models/userModel');
const Order = require('./src/models/orderModel');
const Product = require('./src/models/productModel');
const Settings = require('./src/models/settingsModel');
const { sendEmail } = require('./src/controllers/authController'); // For sending notifications

// Connect to MongoDB Database
connectDB();

const PORT = process.env.PORT || 3000;

// Start the Express server
const server = app.listen(
  PORT,
  logger.info(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT} 🔥`)
);

// --- SCHEDULED JOB 1: INACTIVE CART CLEANUP ---
logger.info('Scheduled task for inactive cart cleanup is set to run every hour.');
cron.schedule('0 * * * *', async () => {
    const jobStartTime = new Date();
    logger.info(`[${jobStartTime.toLocaleString()}] Running scheduled job: Clearing inactive carts...`);
    const sixtyMinutesAgo = new Date(Date.now() - 60 * 60 * 1000);
    try {
        const result = await User.updateMany(
            {
                'cart.0': { $exists: true },
                lastCartUpdate: { $lt: sixtyMinutesAgo }
            },
            {
                $set: { cart: [], lastCartUpdate: Date.now() }
            }
        );
        if (result.modifiedCount > 0) {
           logger.info(`[${jobStartTime.toLocaleString()}] Inactive carts cleared: ${result.modifiedCount} users affected.`);
        } else {
           logger.info(`[${jobStartTime.toLocaleString()}] No inactive carts found to clear.`);
        }
    } catch (error) {
        logger.error(`[${jobStartTime.toLocaleString()}] Error during inactive cart cleanup:`, error);
    }
});

// --- SCHEDULED JOB 2: SUBSCRIPTION ORDER CREATION ---
logger.info('Scheduled task for subscriptions is set to run daily at 5:00 AM.');
cron.schedule('0 5 * * *', async () => {
    const jobStartTime = new Date();
    logger.info(`[${jobStartTime.toLocaleString()}] Running scheduled job: Processing subscriptions...`);
    
    const usersWithActiveSubs = await User.find({ 
        'subscriptions.isActive': true,
        'subscriptions.nextDeliveryDate': { $lte: new Date() }
    }).populate('subscriptions.product');

    for (const user of usersWithActiveSubs) {
        for (const sub of user.subscriptions) {
            if (sub.isActive && sub.nextDeliveryDate <= new Date()) {
                let orderCreated = false;
                let failureReason = "";
                try {
                    const product = sub.product;
                    const storeInventory = product.inventory.find(inv => inv.store.toString() === sub.store.toString());
                    if (!product.isAvailable || !storeInventory || storeInventory.stock < sub.quantity) {
                        failureReason = `Product "${product.name}" is out of stock.`;
                        throw new Error(failureReason);
                    }
                    const settings = await Settings.findOne({ siteIdentifier: 'quickkart_settings' });
                    if (settings && settings.allowedPincodes.length > 0 && !settings.allowedPincodes.includes(sub.shippingAddress.pincode)) {
                        failureReason = `Delivery to pincode ${sub.shippingAddress.pincode} is unavailable.`;
                        throw new Error(failureReason);
                    }
                    const itemsPrice = product.price * sub.quantity;
                    const taxPrice = parseFloat((itemsPrice * 0.05).toFixed(2));
                    const shippingPrice = 20.00;
                    const totalPrice = parseFloat((itemsPrice + taxPrice + shippingPrice).toFixed(2));
                    const order = new Order({
                        user: user._id,
                        orderItems: [{ name: product.name, qty: sub.quantity, image: product.image, price: product.price, product: product._id }],
                        shippingAddress: sub.shippingAddress,
                        paymentMethod: 'Cash on Delivery',
                        totalPrice: totalPrice, taxPrice: taxPrice, shippingPrice: shippingPrice,
                    });
                    await order.save();
                    await Product.updateOne(
                        { _id: product._id, 'inventory.store': sub.store },
                        { $inc: { 'inventory.$.stock': -sub.quantity } }
                    );
                    orderCreated = true;
                    logger.info(`Created subscription order ${order._id} for user ${user.email}`);
                } catch (error) {
                    logger.error(`Failed to create subscription order for user ${user.email} (Sub ID: ${sub._id}):`, error.message);
                    if (user.email) {
                        try {
                            await sendEmail({
                                email: user.email,
                                subject: 'QuickKart Subscription Failed',
                                message: `Hi ${user.name},\n\nWe couldn't process your subscription for "${sub.product.name}".\nReason: ${failureReason || 'An error occurred.'}\nYour subscription is paused.\n\nQuickKart Team`,
                            });
                        } catch (emailError) { logger.error('Failed to send subscription failure email:', emailError); }
                    }
                    sub.isActive = false;
                }
                if (orderCreated) {
                    const nextDate = new Date(sub.nextDeliveryDate);
                    if (sub.frequency === 'Daily') { nextDate.setDate(nextDate.getDate() + 1); }
                    else if (sub.frequency === 'Weekly') { nextDate.setDate(nextDate.getDate() + 7); }
                    else if (sub.frequency === 'Monthly') { nextDate.setMonth(nextDate.getMonth() + 1); }
                    sub.nextDeliveryDate = nextDate;
                }
                await user.save();
            }
        }
    }
    logger.info(`[${new Date().toLocaleString()}] Subscription job finished.`);
});

// --- SCHEDULED JOB 3: LOW STOCK ALERTS ---
logger.info('Scheduled task for low stock alerts is set to run daily at 8:00 AM.');
cron.schedule('0 8 * * *', async () => {
    const jobStartTime = new Date();
    logger.info(`[${jobStartTime.toLocaleString()}] Running scheduled job: Checking for low stock products...`);
    try {
        const settings = await Settings.findOne({ siteIdentifier: 'quickkart_settings' });
        const threshold = settings ? settings.lowStockThreshold : 10;
        const lowStockProducts = await Product.aggregate([
            { $match: { isAvailable: true } },
            { $unwind: '$inventory' },
            { $match: { 'inventory.stock': { $lte: threshold } } },
            { $lookup: { from: 'darkstores', localField: 'inventory.store', foreignField: '_id', as: 'storeDetails' } },
            { $unwind: '$storeDetails' },
            { $project: { _id: 0, name: '$name', stock: '$inventory.stock', storeName: '$storeDetails.name' } },
            { $sort: { stock: 1 } }
        ]);
        if (lowStockProducts.length > 0) {
            const admins = await User.find({ role: 'Admin' }).select('email name');
            if (admins.length > 0) {
                let emailBody = `Hi Admin,\n\nThe following products are running low on stock (Threshold: ${threshold} units):\n\n`;
                lowStockProducts.forEach(p => {
                    emailBody += `- ${p.name} (Stock: ${p.stock} at ${p.storeName})\n`;
                });
                emailBody += `\nPlease restock them soon.\n\nQuickKart System Alert`;
                for (const admin of admins) {
                    try {
                        await sendEmail({
                            email: admin.email,
                            subject: `🔴 QuickKart Low Stock Alert - ${lowStockProducts.length} Products`,
                            message: emailBody,
                        });
                        logger.info(`Low stock alert email sent to admin: ${admin.email}`);
                    } catch (emailError) {
                        logger.error(`Failed to send low stock alert to ${admin.email}:`, emailError);
                    }
                }
            }
        } else {
            logger.info(`[${jobStartTime.toLocaleString()}] No low stock products found.`);
        }
    } catch (error) {
        logger.error(`[${jobStartTime.toLocaleString()}] Error during low stock alert job:`, error);
    }
});
// --- END CRON JOBS ---

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  logger.error(`Unhandled Rejection: ${err.message}`, { stack: err.stack });
  server.close(() => process.exit(1));
});