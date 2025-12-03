// utils/seeder.js
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const connectDB = require('../src/config/db'); // Adjust path if needed

// Load Models
const DarkStore = require('../src/models/darkStoreModel'); // Adjust path
const Product = require('../src/models/productModel');   // Adjust path
const User = require('../src/models/userModel');       // Adjust path (needed for admin user)

// Load env vars
dotenv.config({ path: '../.env' }); // Point to your main .env file

// Connect to DB
connectDB();

// --- Sample Data ---
const sampleStorePincode = '452020'; // Use the pincode you are testing with
let sampleStoreId = null; // We'll get this after creating the store
let sampleAdminUserId = null; // We'll find an admin user

// --- Functions ---

const importData = async () => {
  try {
    // Clear existing sample data (optional, be careful!)
    // await DarkStore.deleteMany({ pincode: sampleStorePincode });
    // await Product.updateMany({}, { $set: { inventory: [] } }); // Clears inventory - USE WITH CAUTION

    // 1. Find an Admin User (to associate products with)
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.error('Error: No admin user found. Please create an admin first.');
      process.exit(1);
    }
    sampleAdminUserId = adminUser._id;
    console.log('Admin user found:', sampleAdminUserId);

    // 2. Create a Sample Dark Store
    const store = await DarkStore.create({
      name: `Store ${sampleStorePincode}`,
      pincode: sampleStorePincode,
      // Add other required fields for DarkStore model
      address: '123 Sample St',
      city: 'Indore', // Example
      state: 'MP', // Example
      location: { type: 'Point', coordinates: [75.8577, 22.7196] } // Example coords for Indore
    });
    sampleStoreId = store._id;
    console.log('Dark Store Created:', store.name, store._id);

    // 3. Find or Create a Sample Product (linked to the admin)
    let product1 = await Product.findOne({ name: 'Sample Product 1' });
    if (!product1) {
      product1 = await Product.create({
        user: sampleAdminUserId,
        name: 'Sample Product 1',
        price: 150,
        description: 'First sample product',
        category: 'Grocery',
        brand: 'SampleBrand',
        stock: 50, // Main stock (optional if using only zonal)
        image: '/images/sample.jpg', // Placeholder
        imageUrl: '/images/sample.jpg',
        isAvailable: true,
        inventory: [], // Start with empty inventory
      });
      console.log('Sample Product 1 Created');
    } else {
       console.log('Sample Product 1 Found');
    }


    // 4. Add Inventory for the product at the created store
    product1.inventory.push({
      store: sampleStoreId,
      stock: 25, // Stock available at this specific store
    });
    await product1.save();
    console.log(`Inventory added for ${product1.name} at store ${sampleStorePincode}`);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error importing data: ${error}`);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    await DarkStore.deleteMany({ pincode: sampleStorePincode });
    // Remove inventory entry from products (more complex, might need specific query)
    await Product.updateMany(
        { 'inventory.store': sampleStoreId }, // Find products with this store in inventory
        { $pull: { inventory: { store: sampleStoreId } } } // Remove that entry
    );
     // Optionally delete the sample product itself
    // await Product.deleteOne({ name: 'Sample Product 1', user: sampleAdminUserId });


    console.log('Data Destroyed!');
    process.exit();
  } catch (error) {
    console.error(`Error destroying data: ${error}`);
    process.exit(1);
  }
};

// --- Script Execution ---
// Check command line arguments
if (process.argv[2] === '-d') { // '-d' flag for destroy
  destroyData();
} else {
  importData();
}