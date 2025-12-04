// src/config/fileUpload.js
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary using your .env variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer to use Cloudinary storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'quickkart-products', // A folder name in your Cloudinary account
    allowed_formats: ['jpg', 'png', 'jpeg', 'webp' , 'avif'],
    transformation: [{ width: 500, height: 500, crop: 'limit' }] // Optional: Resize images
  },
});

// Create the Multer upload instance
const upload = multer({ storage: storage });

module.exports = upload;