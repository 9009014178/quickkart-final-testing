const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Product = require('../models/productModel.js');
const User = require('../models/userModel.js'); // 👈 for admin user reference
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const products = [
  {
    name: "Coca-Cola Can 300ml",
    description: "Chilled Coca-Cola soft drink in a convenient 300ml can. Perfect for refreshment anytime.",
    image: "/uploads/products/coca-cola-can-300ml.jpg",
    brand: "Coca-Cola",
    category: "Beverages",
    price: 45,
    salePrice: 40,
    stock: 250,
    isAvailable: true,
    rating: 4.8,
    numReviews: 212,
  },
  {
    name: "Amul Pure Ghee 1kg",
    description: "Pure and aromatic ghee made from cow’s milk for authentic Indian cooking.",
    image: "/uploads/products/amul-ghee-1kg.jpg",
    brand: "Amul",
    category: "Dairy",
    price: 615,
    salePrice: 590,
    stock: 120,
    isAvailable: true,
    rating: 4.9,
    numReviews: 145,
  },
  {
    name: "Kurkure Masala Munch 90g",
    description: "Crunchy and spicy corn puffs with the perfect Indian masala flavor.",
    image: "/uploads/products/kurkure-masala-90g.jpg",
    brand: "Kurkure",
    category: "Snacks",
    price: 25,
    salePrice: 22,
    stock: 400,
    isAvailable: true,
    rating: 4.7,
    numReviews: 289,
  },
  {
    name: "KitKat Chocolate 4 Finger 37g",
    description: "Crispy wafer fingers coated in smooth milk chocolate.",
    image: "/uploads/products/kitkat-4finger.jpg",
    brand: "Nestle",
    category: "Snacks",
    price: 30,
    salePrice: 28,
    stock: 500,
    isAvailable: true,
    rating: 4.9,
    numReviews: 324,
  },
  {
    name: "Kwality Walls Cornetto Ice Cream Cone 110ml",
    description: "Delicious crispy cone filled with vanilla and chocolate ice cream topped with nuts.",
    image: "/uploads/products/cornetto-icecream.jpg",
    brand: "Kwality Walls",
    category: "Frozen Foods",
    price: 60,
    salePrice: 55,
    stock: 80,
    isAvailable: true,
    rating: 4.8,
    numReviews: 142,
  },
  {
    name: "Dairy Milk Silk 150g",
    description: "Smooth, creamy and indulgent Cadbury Dairy Milk Silk chocolate bar.",
    image: "/uploads/products/dairy-milk-silk-150g.jpg",
    brand: "Cadbury",
    category: "Snacks",
    price: 170,
    salePrice: 155,
    stock: 180,
    isAvailable: true,
    rating: 4.9,
    numReviews: 410,
  },
  {
    name: "Nestle Munch Chocolate 32g",
    description: "Crunchy wafer coated with delicious milk chocolate.",
    image: "/uploads/products/munch-32g.jpg",
    brand: "Nestle",
    category: "Snacks",
    price: 10,
    salePrice: 9,
    stock: 800,
    isAvailable: true,
    rating: 4.8,
    numReviews: 230,
  },
  {
    name: "Sprite Can 300ml",
    description: "Refreshing lemon-lime flavored soda drink with a crisp, clean taste.",
    image: "/uploads/products/sprite-can-300ml.jpg",
    brand: "Sprite",
    category: "Beverages",
    price: 45,
    salePrice: 40,
    stock: 250,
    isAvailable: true,
    rating: 4.7,
    numReviews: 192,
  },
  {
    name: "Britannia Bourbon Biscuits 150g",
    description: "Rich chocolate cream biscuits with a delightful crunchy texture.",
    image: "/uploads/products/britannia-bourbon-150g.jpg",
    brand: "Britannia",
    category: "Snacks",
    price: 35,
    salePrice: 30,
    stock: 200,
    isAvailable: true,
    rating: 4.8,
    numReviews: 250,
  },
  {
    name: "Monster Energy Drink 350ml",
    description: "High-caffeine energy drink to keep you going — bold taste and strong boost.",
    image: "/uploads/products/monster-energy-350ml.jpg",
    brand: "Monster",
    category: "Beverages",
    price: 160,
    salePrice: 150,
    stock: 100,
    isAvailable: true,
    rating: 4.7,
    numReviews: 134,
  },
  {
    "name": "Red Bull Energy Drink 355ml",
    "description": "Classic Red Bull energy drink with caffeine, taurine, and B-vitamins for instant energy and alertness.",
    "image": "/uploads/products/redbull-energy-355ml.jpg",
    "brand": "Red Bull",
    "category": "Beverages",
    "price": 155,
    "salePrice": 145,
    "stock": 120,
    "isAvailable": true,
    "rating": 4.8,
    "numReviews": 275
  },
  {
    "name": "Sting Energy Drink 250ml",
    "description": "Refreshing and tangy Sting energy drink that keeps you charged all day long.",
    "image": "/uploads/products/sting-energy-250ml.jpg",
    "brand": "PepsiCo",
    "category": "Beverages",
    "price": 35,
    "salePrice": 30,
    "stock": 220,
    "isAvailable": true,
    "rating": 4.7,
    "numReviews": 190
  },
  {
    "name": "Uncle Chipps Spicy Treat Flavour Potato Chips 55g",
    "description": "Crispy potato chips bursting with spicy treat flavor for a perfect crunchy snack.",
    "image": "/uploads/products/uncle-chipps-spicy-treat-55g.jpg",
    "brand": "Uncle Chipps",
    "category": "Snacks",
    "price": 25,
    "salePrice": 22,
    "stock": 350,
    "isAvailable": true,
    "rating": 4.6,
    "numReviews": 240
  },
  {
    "name": "Balaji Crunchex Chilli Tadka Potato Wafers 45g",
    "description": "Zesty chilli tadka flavored potato wafers by Balaji — crunchy and full of spice.",
    "image": "/uploads/products/balaji-crunchex-chilli-tadka.jpg",
    "brand": "Balaji",
    "category": "Snacks",
    "price": 20,
    "salePrice": 18,
    "stock": 400,
    "isAvailable": true,
    "rating": 4.6,
    "numReviews": 210
  },
  {
    "name": "Balaji Wafers Masala Sev Murmura Namkeen 150g",
    "description": "A crispy and tasty mix of sev, murmura, and traditional Indian spices.",
    "image": "/uploads/products/balaji-masala-sev-murmura.jpg",
    "brand": "Balaji",
    "category": "Snacks",
    "price": 35,
    "salePrice": 30,
    "stock": 300,
    "isAvailable": true,
    "rating": 4.7,
    "numReviews": 198
  },
  {
    "name": "Top N Town Zero Maida Millet Bread 400g",
    "description": "Soft, healthy bread made with 100% millet flour and zero maida. High fiber and nutritious.",
    "image": "/uploads/products/topntown-millet-bread.jpg",
    "brand": "Top N Town",
    "category": "Bakery",
    "price": 55,
    "salePrice": 50,
    "stock": 150,
    "isAvailable": true,
    "rating": 4.8,
    "numReviews": 105
  },
  {
    "name": "Amul Salted Butter 500g",
    "description": "Rich and creamy salted butter by Amul, made from pure cow’s milk — perfect for everyday cooking and spreading.",
    "image": "/uploads/products/amul-butter-500g.jpg",
    "brand": "Amul",
    "category": "Dairy",
    "price": 285,
    "salePrice": 270,
    "stock": 180,
    "isAvailable": true,
    "rating": 4.9,
    "numReviews": 315
  },
];

const importData = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    // 👇 Find an admin user or the first one
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('⚠️ No admin user found. Please register an admin first.');
      process.exit(1);
    }

    const formattedProducts = products.map((p) => ({
      ...p,
      user: adminUser._id,           // required by your model
      imagePublicId: 'local-upload', // placeholder for non-Cloudinary image
    }));

    await Product.insertMany(formattedProducts);
    console.log('✅ Products added successfully!');
    process.exit();
  } catch (error) {
    console.error('❌ Error adding products:', error.message);
    process.exit(1);
  }
};

importData();
