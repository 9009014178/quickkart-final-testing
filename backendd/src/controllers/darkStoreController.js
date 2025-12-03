const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const DarkStore = require('../models/darkStoreModel.js');
const Product = require('../models/productModel.js'); // 1. Product model ko import karo

/**
 * @desc    Create a new dark store
 * @route   POST /api/stores
 * @access  Private/Admin
 */
const createStore = asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, pincode, address, latitude, longitude } = req.body;

    const storeExists = await DarkStore.findOne({ pincode });
    if (storeExists) {
        res.status(400);
        throw new Error('A dark store in this pincode already exists');
    }

    const store = await DarkStore.create({
        name,
        pincode,
        address,
        location: {
            type: 'Point',
            coordinates: [longitude, latitude],
        },
    });

    res.status(201).json(store);
});

/**
 * @desc    Get all dark stores
 * @route   GET /api/stores
 * @access  Private/Admin
 */
const getStores = asyncHandler(async (req, res) => {
    const stores = await DarkStore.find({});
    res.json(stores);
});

/**
 * @desc    Delete a dark store
 * @route   DELETE /api/stores/:id
 * @access  Private/Admin
 */
const deleteStore = asyncHandler(async (req, res) => {
    // Validation check (from route param)
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const store = await DarkStore.findById(req.params.id);

    if (store) {
        // --- 2. Advanced Logic: Clean up inventory ---
        // Jab store delete ho, toh products me se uski inventory entries bhi hata do.
        try {
            await Product.updateMany(
                { 'inventory.store': store._id }, // Un sabhi products ko dhoondo
                { $pull: { inventory: { store: store._id } } } // Jinke inventory array se is store ki entry ko nikaal do
            );
        } catch (error) {
            console.error(`Failed to clean up inventory for store ${store._id}:`, error);
            // Error ko log karo, lekin store deletion ko mat roko
        }
        // --- End Cleanup Logic ---

        await store.deleteOne();
        res.json({ message: 'Dark store removed' });
    } else {
        res.status(404);
        throw new Error('Dark store not found');
    }
});

module.exports = {
    createStore,
    getStores,
    deleteStore,
};