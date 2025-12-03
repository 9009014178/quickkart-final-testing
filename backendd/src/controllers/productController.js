const Product = require('../models/productModel.js');
// ❌ Removed DarkStore import as it's not needed for the simplified logic
// const DarkStore = require('../models/darkStoreModel.js');
const Settings = require('../models/settingsModel.js'); // Keep if used elsewhere
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const mongoose = require('mongoose');
const cloudinary = require('cloudinary').v2;

/**
 * @desc    Fetch available products (Simplified - No Pincode/Store Check)
 * @route   GET /api/products
 * @access  Public
 */
const getProducts = asyncHandler(async (req, res) => {
    // --- Pincode/Store checks are removed ---

    // --- Build Filters ---
    const filters = {};
    if (req.query.keyword) {
        filters.name = { $regex: req.query.keyword, $options: 'i' }; // Case-insensitive search
    }
    if (req.query.category) {
        filters.category = req.query.category;
    }
    // Price range filtering
    if (req.query.minPrice || req.query.maxPrice) {
        filters.price = {};
        if (req.query.minPrice) filters.price.$gte = Number(req.query.minPrice);
        if (req.query.maxPrice) filters.price.$lte = Number(req.query.maxPrice);
    }
    // Ensure product is marked as available
    filters.isAvailable = true;
    // ✅ Optionally filter by stock > 0 using the simple stock field
    // filters.stock = { $gt: 0 };

    // --- Sorting ---
    const sortBy = req.query.sortBy || '-createdAt'; // Default sort by newest

    // --- Fetch Products ---
    const products = await Product.find(filters).sort(sortBy);

    res.json(products); // Send the filtered products
});

/**
 * @desc    Fetch a single product by ID
 * @route   GET /api/products/:id
 * @access  Public
 */
const getProductById = asyncHandler(async (req, res) => {
    // ❌ Removed inventory.store population as it's no longer relevant
    const product = await Product.findById(req.params.id)
                          .populate('reviews.user', 'name'); // Keep user population for reviews

    if (product) {
        res.json(product);
    } else {
        res.status(404);
        throw new Error('Product not found');
    }
});

/**
 * @desc    Delete a product (Admin only)
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 */
const deleteProduct = asyncHandler(async (req, res) => {
    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404); throw new Error('Product not found');
    }
    // Optional: Keep creator check if needed
    // if (product.user.toString() !== req.user._id.toString()) { ... }

    // Delete Cloudinary image if public ID exists
    if (product.imagePublicId) {
        try {
            await cloudinary.uploader.destroy(product.imagePublicId);
        } catch (cloudinaryError) {
             console.warn(`Cloudinary delete failed for ${product.imagePublicId}: ${cloudinaryError.message}`);
        }
    }
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product removed' });
});

/**
 * @desc    Create a product (Admin only)
 * @route   POST /api/products
 * @access  Private/Admin
 */
const createProduct = asyncHandler(async (req, res) => {
    const errors = validationResult(req); // Check validation results
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    // ✅ Destructure using the simple 'stock' field
    const { name, description, price, brand, category, stock, features } = req.body;
    if (!req.file) {
        res.status(400); throw new Error('Product image is required');
    }

    const product = new Product({
        user: req.user._id,
        name,
        description,
        price: Number(price),
        category,
        brand,
        stock: Number(stock), // Use the simple stock field
        image: req.file.path,
        imagePublicId: req.file.filename,
        isAvailable: Number(stock) > 0, // Set availability based on initial stock
        features: features ? JSON.parse(features) : [],
        // ❌ Removed inventory and unavailablePincodes
        // inventory: [],
        // unavailablePincodes: [],
    });

    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
});

/**
 * @desc    Update a product (Admin only)
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
const updateProduct = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const product = await Product.findById(req.params.id);
    if (!product) {
        res.status(404); throw new Error('Product not found');
    }
    // Optional: Keep creator check
    // if (product.user.toString() !== req.user._id.toString()) { ... }

    // ✅ Destructure using the simple 'stock' field
    const { name, price, description, brand, category, salePrice, saleEndDate, isAvailable, stock, features } = req.body;

    // Update fields conditionally
    if (name !== undefined) product.name = name;
    if (price !== undefined) product.price = Number(price);
    if (description !== undefined) product.description = description;
    if (brand !== undefined) product.brand = brand;
    if (category !== undefined) product.category = category;
    if (salePrice !== undefined) product.salePrice = salePrice ? Number(salePrice) : undefined;
    if (saleEndDate !== undefined) product.saleEndDate = saleEndDate ? new Date(saleEndDate) : undefined;
    // ✅ Update simple stock field
    if (stock !== undefined) product.stock = Number(stock);
    // ✅ Update isAvailable, potentially based on stock
    if (isAvailable !== undefined) {
        product.isAvailable = isAvailable === 'true' || isAvailable === true;
    } else if (stock !== undefined) {
        // Automatically set availability based on stock if isAvailable not provided
        product.isAvailable = Number(stock) > 0;
    }
    if (features !== undefined) {
        try { product.features = Array.isArray(features) ? features : JSON.parse(features); }
        catch (e) { console.warn("Could not parse features:", features); }
    }
    // ❌ Removed unavailablePincodes update logic

    // Handle image update (remains the same)
    if (req.file) {
        if (product.imagePublicId) {
            try { await cloudinary.uploader.destroy(product.imagePublicId); }
            catch (cloudinaryError) { console.warn(`Cloudinary delete failed: ${cloudinaryError.message}`); }
        }
        product.image = req.file.path;
        product.imagePublicId = req.file.filename;
    }

    const updatedProduct = await product.save();
    res.json(updatedProduct);
});

// ❌ Removed updateInventoryForStore function - No longer needed

/**
 * @desc    Create new review
 * @route   POST /api/products/:id/reviews
 * @access  Private
 */
const createProductReview = asyncHandler(async (req, res) => {
    // ... (No changes needed, logic remains the same) ...
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { rating, comment } = req.body; const product = await Product.findById(req.params.id);
    if (!product) { res.status(404); throw new Error('Product not found'); }
    // Optional: Add check if (product.stock <= 0) { throw new Error('Cannot review out-of-stock product'); }
    const alreadyReviewed = product.reviews.find(r => r.user.toString() === req.user._id.toString());
    if (alreadyReviewed) { res.status(400); throw new Error('Product already reviewed'); }
    const review = { name: req.user.name, rating: Number(rating), comment, user: req.user._id };
    product.reviews.push(review); product.numReviews = product.reviews.length;
    product.rating = parseFloat((product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length).toFixed(1));
    await product.save(); res.status(201).json({ message: 'Review added successfully' });
});

/**
 * @desc    Get all products (For Admin)
 * @route   GET /api/products/all
 * @access  Private/Admin
 */
const getAllProductsAdmin = asyncHandler(async (req, res) => {
    // ✅ Simplified population (no inventory.store)
    const products = await Product.find({})
                          .populate('user', 'name email')
                          .sort('-createdAt');
    res.json(products);
});

module.exports = {
    getProducts, // Export the simplified function
    getProductById,
    deleteProduct,
    createProduct,
    updateProduct,
    createProductReview,
    // ❌ Removed updateInventoryForStore from exports
    // updateInventoryForStore,
    getAllProductsAdmin,
};