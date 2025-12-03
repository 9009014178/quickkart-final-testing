// src/config/firebaseAdmin.js
const admin = require('firebase-admin');

// Service account key file ka path
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

console.log('Firebase Admin SDK Initialized... 🔥');

module.exports = admin;