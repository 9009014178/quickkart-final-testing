const admin = require('../config/firebaseAdmin'); // Import our initialized Firebase admin

/**
 * @desc    Sends a push notification to a specific device
 * @param {string} fcmToken - The Firebase Cloud Messaging token for the device
 * @param {string} title - The title of the notification
 * @param {string} body - The body/message of the notification
 * @param {object} data - Optional: Extra data to send with the notification (e.g., orderId)
 */
const sendPushNotification = async (fcmToken, title, body, data = {}) => {
  if (!fcmToken) {
    console.error('No FCM token provided, skipping push notification.');
    return;
  }

  // Define the message payload
  const message = {
    token: fcmToken,
    notification: {
      title: title,
      body: body,
    },
    data: data, // You can send data like { orderId: '123' }
    // Set Android specific options (optional)
    android: {
        notification: {
            sound: 'default',
            priority: 'high',
        }
    },
    // Set Apple specific options (optional)
    apns: {
        payload: {
            aps: {
                sound: 'default',
            }
        }
    }
  };

  try {
    // Send the message
    const response = await admin.messaging().send(message);
    console.log('Successfully sent push notification:', response);
  } catch (error) {
    // Handle common errors
    if (error.code === 'messaging/registration-token-not-registered') {
        console.warn(`FCM token ${fcmToken} is not registered. It might be invalid or uninstalled.`);
        // Here you might want to delete the token from your User model
    } else {
        console.error('Error sending push notification:', error);
    }
  }
};

module.exports = sendPushNotification;