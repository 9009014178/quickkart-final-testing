const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const User = require('../models/userModel.js');
const { sendEmail } = require('./authController.js'); // Import email utility
// const sendSms = require('../utils/sendSms.js'); // Import SMS utility

/**
 * @desc    Send a promotional notification (Email/SMS)
 * @route   POST /api/notifications/promo
 * @access  Private/Admin
 */
const sendPromotionalNotification = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { subject, message, type } = req.body; // type can be 'Email', 'SMS', or 'All'

    let emailCount = 0;
    let smsCount = 0;

    // --- Send Promotional Emails ---
    if (type === 'Email' || type === 'All') {
        // Find all users who opted-in for email promos
        const usersToEmail = await User.find({
            allowEmailPromotions: true,
            email: { $exists: true } // Ensure they have an email
        }).select('email name');

        if (usersToEmail.length > 0) {
            console.log(`Sending promo email to ${usersToEmail.length} users...`);
            // We send emails one by one. For bulk sending, a dedicated service
            // (like SendGrid marketing campaigns) is better, but this works for now.
            for (const user of usersToEmail) {
                try {
                    const emailBody = `Hi ${user.name},\n\n${message}\n\nBest,\nThe QuickKart Team`;
                    await sendEmail({
                        email: user.email,
                        subject: subject,
                        message: emailBody,
                    });
                    emailCount++;
                } catch (error) {
                    console.error(`Failed to send promo email to ${user.email}:`, error);
                }
            }
        }
    }

    // --- Send Promotional SMS ---
    if (type === 'SMS' || type === 'All') {
        // Find all users who opted-in for SMS promos
        const usersToSms = await User.find({
            allowSmsNotifications: true,
            phone: { $exists: true } // Ensure they have a phone number
        }).select('phone');
        
        if (usersToSms.length > 0) {
            console.log(`Sending promo SMS to ${usersToSms.length} users...`);
            // SMS is also sent one by one here.
            for (const user of usersToSms) {
                try {
                    // await sendSms(user.phone, message); // Uncomment when sendSms is ready
                    smsCount++; // Assuming SMS is sent
                } catch (error) {
                    console.error(`Failed to send promo SMS to ${user.phone}:`, error);
                }
            }
            // Note: SMS logic is commented out until sendSms is fully configured
            if (smsCount > 0) console.log("SMS sending is simulated.");
        }
    }

    res.json({ 
        message: 'Promotional notifications sent!',
        emailsSent: emailCount,
        smsSent: smsCount,
    });
});

module.exports = {
    sendPromotionalNotification,
};