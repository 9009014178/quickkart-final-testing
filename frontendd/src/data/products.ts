// export interface Product {
//   id: string;
//   name: string;
//   price: number;
//   originalPrice?: number;
//   image: string;
//   category: string;
//   description: string;
//   rating: number;
//   reviews: number;
//   // 🔄 CHANGED: Replaced 'inStock: boolean' with 'inventory: number'
//   inventory: number; 
//   features: string[];
// }

// export const categories = [
//   'All',
//   'Fruits & Vegetables',
//   'Dairy & Eggs',
//   'Snacks & Beverages',
//   'Personal Care',
//   'Household Items',
//   'Instant Food',
// ];

// export const products: Product[] = [
//   // Fruits & Vegetables
//   {
//     id: '1',
//     name: 'Fresh Bananas',
//     price: 48,
//     originalPrice: 55,
//     image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
//     category: 'Fruits & Vegetables',
//     description: 'Fresh organic bananas, perfect for your daily potassium needs. Delivered in 10 minutes.',
//     rating: 4.8,
//     reviews: 1247,
//     // 🔄 CHANGED: Value now represents quantity in stock
//     inventory: 500, 
//     features: ['Organic', 'Fresh', 'High Potassium', 'Ready to Eat'],
//   },
//   {
//     id: '2',
//     name: 'Fresh Tomatoes',
//     price: 35,
//     originalPrice: 42,
//     image: 'https://images.unsplash.com/photo-1546470427-e16b82d4c0b8?w=400&q=80',
//     category: 'Fruits & Vegetables',
//     description: 'Garden fresh tomatoes, ideal for cooking and salads. Farm fresh quality.',
//     rating: 4.6,
//     reviews: 892,
//     inventory: 350,
//     features: ['Farm Fresh', 'Perfect for Cooking', 'Rich in Vitamins', 'Organic'],
//   },
//   {
//     id: '3',
//     name: 'Green Apples',
//     price: 180,
//     originalPrice: 200,
//     image: 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?w=400&q=80',
//     category: 'Fruits & Vegetables',
//     description: 'Crisp and juicy green apples, perfect for snacking and cooking.',
//     rating: 4.7,
//     reviews: 654,
//     inventory: 200,
//     features: ['Crisp & Juicy', 'Rich in Fiber', 'Natural Sweetness', 'Fresh'],
//   },
//   {
//     id: '4',
//     name: 'Fresh Onions',
//     price: 25,
//     originalPrice: 30,
//     image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&q=80',
//     category: 'Fruits & Vegetables',
//     description: 'Premium quality onions, essential for Indian cooking. Fresh from farms.',
//     rating: 4.5,
//     reviews: 432,
//     inventory: 600,
//     features: ['Premium Quality', 'Essential for Cooking', 'Fresh', 'Long Lasting'],
//   },
//   {
//     id: '5',
//     name: 'Fresh Potatoes',
//     price: 22,
//     originalPrice: 28,
//     image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=400&q=80',
//     category: 'Fruits & Vegetables',
//     description: 'High-quality potatoes perfect for all your cooking needs.',
//     rating: 4.4,
//     reviews: 789,
//     inventory: 700,
//     features: ['Versatile', 'High Quality', 'Perfect for Cooking', 'Fresh'],
//   },
//   {
//     id: '6',
//     name: 'Fresh Carrots',
//     price: 45,
//     originalPrice: 52,
//     image: 'https://images.unsplash.com/photo-1447175008436-054170c2e979?w=400&q=80',
//     category: 'Fruits & Vegetables',
//     description: 'Sweet and crunchy carrots, rich in vitamins and perfect for salads.',
//     rating: 4.6,
//     reviews: 567,
//     inventory: 400,
//     features: ['Sweet & Crunchy', 'Rich in Vitamins', 'Perfect for Salads', 'Fresh'],
//   },
//   {
//     id: '7',
//     name: 'Fresh Lemons',
//     price: 55,
//     originalPrice: 65,
//     image: 'https://images.unsplash.com/photo-1590004953392-5aba2e5e2d96?w=400&q=80',
//     category: 'Fruits & Vegetables',
//     description: 'Juicy lemons perfect for cooking, drinks and health benefits.',
//     rating: 4.8,
//     reviews: 321,
//     inventory: 150,
//     features: ['Juicy', 'Perfect for Drinks', 'Rich in Vitamin C', 'Fresh'],
//   },
//   {
//     id: '8',
//     name: 'Fresh Spinach',
//     price: 18,
//     originalPrice: 25,
//     image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=400&q=80',
//     category: 'Fruits & Vegetables',
//     description: 'Fresh green spinach leaves, packed with iron and nutrients.',
//     rating: 4.5,
//     reviews: 445,
//     inventory: 300,
//     features: ['Rich in Iron', 'Nutrient Dense', 'Fresh Green', 'Healthy'],
//   },

//   // Dairy & Eggs
//   {
//     id: '9',
//     name: 'Amul Fresh Milk',
//     price: 58,
//     originalPrice: 62,
//     image: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?w=400&q=80',
//     category: 'Dairy & Eggs',
//     description: 'Fresh Amul milk, rich in calcium and protein. Perfect for daily consumption.',
//     rating: 4.9,
//     reviews: 2145,
//     inventory: 800,
//     features: ['Rich in Calcium', 'High Protein', 'Fresh Daily', 'Trusted Brand'],
//   },
//   {
//     id: '10',
//     name: 'Farm Fresh Eggs',
//     price: 85,
//     originalPrice: 95,
//     image: 'https://images.unsplash.com/photo-1582722872445-44dc5f7e3c8f?w=400&q=80',
//     category: 'Dairy & Eggs',
//     description: 'Farm fresh eggs, perfect source of protein for your daily needs.',
//     rating: 4.7,
//     reviews: 1832,
//     inventory: 450,
//     features: ['Farm Fresh', 'High Protein', 'Grade A Quality', 'Nutritious'],
//   },
//   {
//     id: '11',
//     name: 'Amul Butter',
//     price: 145,
//     originalPrice: 155,
//     image: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=400&q=80',
//     category: 'Dairy & Eggs',
//     description: 'Creamy Amul butter, perfect for bread, parathas and cooking.',
//     rating: 4.8,
//     reviews: 1567,
//     inventory: 300,
//     features: ['Creamy Texture', 'Perfect for Cooking', 'Trusted Brand', 'Rich Taste'],
//   },
//   {
//     id: '12',
//     name: 'Amul Paneer',
//     price: 95,
//     originalPrice: 105,
//     image: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400&q=80',
//     category: 'Dairy & Eggs',
//     description: 'Fresh Amul paneer, perfect for Indian dishes and curries.',
//     rating: 4.6,
//     reviews: 923,
//     inventory: 250,
//     features: ['Fresh Daily', 'Perfect for Curries', 'High Protein', 'Soft Texture'],
//   },
//   {
//     id: '13',
//     name: 'Fresh Curd',
//     price: 45,
//     originalPrice: 52,
//     image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400&q=80',
//     category: 'Dairy & Eggs',
//     description: 'Fresh homestyle curd, perfect for raita and lassi.',
//     rating: 4.5,
//     reviews: 756,
//     inventory: 150,
//     features: ['Fresh Daily', 'Homestyle', 'Perfect for Raita', 'Probiotic'],
//   },

//   // Snacks & Beverages
//   {
//     id: '14',
//     name: 'Lay\'s Classic Chips',
//     price: 20,
//     originalPrice: 25,
//     image: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=400&q=80',
//     category: 'Snacks & Beverages',
//     description: 'Crispy and delicious Lay\'s classic salted chips for instant snacking.',
//     rating: 4.4,
//     reviews: 2134,
//     inventory: 900,
//     features: ['Crispy', 'Classic Taste', 'Perfect Snack', 'Instant Craving'],
//   },
//   {
//     id: '15',
//     name: 'Coca Cola',
//     price: 40,
//     originalPrice: 45,
//     image: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&q=80',
//     category: 'Snacks & Beverages',
//     description: 'Refreshing Coca Cola to quench your thirst instantly.',
//     rating: 4.6,
//     reviews: 3245,
//     inventory: 750,
//     features: ['Refreshing', 'Classic Taste', 'Ice Cold', 'Instant Energy'],
//   },
//   {
//     id: '16',
//     name: 'Parle-G Biscuits',
//     price: 12,
//     originalPrice: 15,
//     image: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=400&q=80',
//     category: 'Snacks & Beverages',
//     description: 'Classic Parle-G glucose biscuits, perfect with tea and milk.',
//     rating: 4.8,
//     reviews: 4567,
//     inventory: 1200,
//     features: ['Classic Taste', 'Perfect with Tea', 'Energy Boost', 'Affordable'],
//   },
//   {
//     id: '17',
//     name: 'Britannia Marie Gold',
//     price: 35,
//     originalPrice: 40,
//     image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400&q=80',
//     category: 'Snacks & Beverages',
//     description: 'Light and crispy Marie Gold biscuits, perfect for evening snacking.',
//     rating: 4.5,
//     reviews: 1876,
//     inventory: 600,
//     features: ['Light & Crispy', 'Perfect with Tea', 'Classic', 'Healthy Snack'],
//   },
//   {
//     id: '18',
//     name: 'Frooti Mango Drink',
//     price: 25,
//     originalPrice: 30,
//     image: 'https://images.unsplash.com/photo-1546542679-3feb4cc28f9e?w=400&q=80',
//     category: 'Snacks & Beverages',
//     description: 'Delicious mango flavored Frooti drink, perfect for any time.',
//     rating: 4.7,
//     reviews: 2389,
//     inventory: 450,
//     features: ['Mango Flavor', 'Refreshing', 'Perfect for Summer', 'Kids Favorite'],
//   },

//   // Personal Care
//   {
//     id: '19',
//     name: 'Colgate Total Toothpaste',
//     price: 95,
//     originalPrice: 105,
//     image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&q=80',
//     category: 'Personal Care',
//     description: 'Complete oral care with Colgate Total advanced protection toothpaste.',
//     rating: 4.6,
//     reviews: 1567,
//     inventory: 500,
//     features: ['Complete Protection', '12 Hour Protection', 'Fresh Breath', 'Trusted Brand'],
//   },
//   {
//     id: '20',
//     name: 'Head & Shoulders Shampoo',
//     price: 185,
//     originalPrice: 205,
//     image: 'https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&q=80',
//     category: 'Personal Care',
//     description: 'Anti-dandruff shampoo for healthy, dandruff-free hair.',
//     rating: 4.5,
//     reviews: 2134,
//     inventory: 300,
//     features: ['Anti-Dandruff', 'Healthy Hair', 'Clinically Proven', 'Fresh Scent'],
//   },
//   {
//     id: '21',
//     name: 'Dettol Hand Sanitizer',
//     price: 45,
//     originalPrice: 55,
//     image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=400&q=80',
//     category: 'Personal Care',
//     description: 'Instant hand sanitizer with 70% alcohol for effective germ protection.',
//     rating: 4.8,
//     reviews: 3456,
//     inventory: 1500,
//     features: ['70% Alcohol', 'Instant Protection', 'Kills 99.9% Germs', 'Portable'],
//   },
//   {
//     id: '22',
//     name: 'Nivea Body Lotion',
//     price: 125,
//     originalPrice: 145,
//     image: 'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?w=400&q=80',
//     category: 'Personal Care',
//     description: 'Moisturizing body lotion for soft and smooth skin all day.',
//     rating: 4.4,
//     reviews: 1789,
//     inventory: 400,
//     features: ['24 Hour Moisture', 'Soft Skin', 'Quick Absorption', 'Pleasant Fragrance'],
//   },
//   {
//     id: '23',
//     name: 'Dove Soap',
//     price: 65,
//     originalPrice: 75,
//     image: 'https://images.unsplash.com/photo-1583947581924-860bda6a26df?w=400&q=80',
//     category: 'Personal Care',
//     description: 'Gentle Dove beauty bar with moisturizing cream for soft skin.',
//     rating: 4.7,
//     reviews: 2567,
//     inventory: 700,
//     features: ['Moisturizing Cream', '1/4 Moisturizing Cream', 'Gentle', 'Soft Skin'],
//   },

//   // Household Items
//   {
//     id: '24',
//     name: 'Surf Excel Detergent',
//     price: 145,
//     originalPrice: 165,
//     image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&q=80',
//     category: 'Household Items',
//     description: 'Powerful stain removal detergent for spotless clean clothes.',
//     rating: 4.6,
//     reviews: 1876,
//     inventory: 350,
//     features: ['Stain Removal', 'Bright Colors', 'Fresh Fragrance', 'Effective Cleaning'],
//   },
//   {
//     id: '25',
//     name: 'Vim Dishwash Bar',
//     price: 25,
//     originalPrice: 30,
//     image: 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&q=80',
//     category: 'Household Items',
//     description: 'Powerful dishwash bar for sparkling clean utensils and dishes.',
//     rating: 4.5,
//     reviews: 2345,
//     inventory: 800,
//     features: ['Powerful Cleaning', 'Grease Removal', 'Long Lasting', 'Sparkling Clean'],
//   },
//   {
//     id: '26',
//     name: 'Harpic Toilet Cleaner',
//     price: 85,
//     originalPrice: 95,
//     image: 'https://images.unsplash.com/photo-1585421514738-01798e348773?w=400&q=80',
//     category: 'Household Items',
//     description: 'Strong toilet cleaner for 99.9% germ kill and freshness.',
//     rating: 4.7,
//     reviews: 1456,
//     inventory: 400,
//     features: ['99.9% Germ Kill', 'Fresh Fragrance', 'Powerful Formula', 'Hygienic Clean'],
//   },
//   {
//     id: '27',
//     name: 'Good Knight Liquid',
//     price: 55,
//     originalPrice: 65,
//     image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&q=80',
//     category: 'Household Items',
//     description: 'Mosquito repellent liquid for 8-hour protection from mosquitoes.',
//     rating: 4.4,
//     reviews: 987,
//     inventory: 250,
//     features: ['8 Hour Protection', 'No Smoke', 'Pleasant Fragrance', 'Effective'],
//   },
//   {
//     id: '28',
//     name: 'Ariel Washing Powder',
//     price: 195,
//     originalPrice: 215,
//     image: 'https://images.unsplash.com/photo-1610557892134-71ba3cdbc5fa?w=400&q=80',
//     category: 'Household Items',
//     description: 'Superior stain removal washing powder for bright and clean clothes.',
//     rating: 4.8,
//     reviews: 2156,
//     inventory: 200,
//     features: ['Superior Stain Removal', 'Bright Colors', 'Fresh Scent', 'Deep Clean'],
//   },

//   // Instant Food
//   {
//     id: '29',
//     name: 'Maggi 2-Minute Noodles',
//     price: 14,
//     originalPrice: 18,
//     image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400&q=80',
//     category: 'Instant Food',
//     description: 'Quick and tasty Maggi noodles ready in just 2 minutes.',
//     rating: 4.9,
//     reviews: 5678,
//     inventory: 2000,
//     features: ['Ready in 2 Minutes', 'Tasty Masala', 'Easy to Cook', 'Quick Hunger Fix'],
//   },
//   {
//     id: '30',
//     name: 'MTR Ready to Eat Meals',
//     price: 45,
//     originalPrice: 55,
//     image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&q=80',
//     category: 'Instant Food',
//     description: 'Authentic Indian ready-to-eat meals, just heat and serve.',
//     rating: 4.5,
//     reviews: 1234,
//     inventory: 300,
//     features: ['Ready to Eat', 'Authentic Taste', 'Just Heat & Serve', 'Preservative Free'],
//   },
//   {
//     id: '31',
//     name: 'Top Ramen Noodles',
//     price: 12,
//     originalPrice: 15,
//     image: 'https://images.unsplash.com/photo-1576777647209-e8733e7946fc?w=400&q=80',
//     category: 'Instant Food',
//     description: 'Delicious curry flavored instant noodles for quick meals.',
//     rating: 4.3,
//     reviews: 2134,
//     inventory: 500,
//     features: ['Curry Flavor', 'Quick & Easy', 'Satisfying', 'Student Favorite'],
//   },
//   {
//     id: '32',
//     name: 'Knorr Soup Mix',
//     price: 25,
//     originalPrice: 30,
//     image: 'https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400&q=80',
//     category: 'Instant Food',
//     description: 'Instant soup mix with real vegetables and spices.',
//     rating: 4.4,
//     reviews: 876,
//     inventory: 400,
//     features: ['Real Vegetables', 'Rich Flavor', 'Just Add Water', 'Healthy Option'],
//   },
//   {
//     id: '33',
//     name: 'Haldiram\'s Bhujia',
//     price: 35,
//     originalPrice: 42,
//     image: 'https://images.unsplash.com/photo-1606491956689-2ea866880c84?w=400&q=80',
//     category: 'Instant Food',
//     description: 'Crispy and spicy Haldiram\'s bhujia, perfect tea-time snack.',
//     rating: 4.7,
//     reviews: 3456,
//     inventory: 650,
//     features: ['Crispy & Spicy', 'Perfect with Tea', 'Authentic Taste', 'Traditional Recipe'],
//   },
//   {
//     id: '34',
//     name: 'Patanjali Instant Oats',
//     price: 48,
//     originalPrice: 55,
//     image: 'https://images.unsplash.com/photo-1574074606003-0c86e5aef8c2?w=400&q=80',
//     category: 'Instant Food',
//     description: 'Healthy instant oats for quick and nutritious breakfast.',
//     rating: 4.2,
//     reviews: 1567,
//     inventory: 400,
//     features: ['Healthy Breakfast', 'High Fiber', 'Quick Cooking', 'Nutritious'],
//   },
// ];

// export const featuredProducts = products.slice(0, 4);



// export interface Product {
//   id: string;
//   name: string;
//   price: number;
//   originalPrice?: number;
//   image: string;
//   category: string;
//   description: string;
//   rating: number;
//   reviews: number;
//   inventory: number; // 🔄 Quantity in stock
//   features: string[];
// }

// export const categories = [
//   'All',
//   'Fruits & Vegetables',
//   'Dairy & Eggs',
//   'Snacks & Beverages',
//   'Personal Care',
//   'Household Items',
//   'Instant Food',
// ];


// src/data/products.ts (or similar)

// --------------------
// 🛍️ Product Interface
// --------------------
export interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  description: string;
  rating: number;
  reviews: number;
  inventory: number; // Quantity in stock
  features: string[];
}

// --------------------
// 🗂️ Product Categories
// --------------------
export const categories = [
  'All',
  'Fruits & Vegetables',
  'Dairy & Eggs',
  'Snacks & Beverages',
  'Personal Care',
  'Household Items',
  'Instant Food',
];

// --------------------
// 🍎 Placeholder Products
// (Your backend or API will fill this list)
// --------------------
export const products: Product[] = [];

// --------------------
// ⭐ Default Featured Products (static fallback)
// --------------------
export const featuredProducts: Product[] = [
  {
    id: '1',
    name: 'Fresh Bananas',
    price: 48,
    originalPrice: 55,
    image: 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?w=400&q=80',
    category: 'Fruits & Vegetables',
    description: 'Fresh organic bananas, perfect for your daily potassium needs. Delivered in 10 minutes.',
    rating: 4.8,
    reviews: 1247,
    inventory: 500,
    features: ['Organic', 'Fresh', 'High Potassium', 'Ready to Eat'],
  },
  {
  id: '2',
  name: 'Fresh Tomatoes',
  price: 35,
  originalPrice: 42,
  // ✅ FIXED URL (direct Unsplash CDN link)
  image: 'https://imgs.search.brave.com/cqla8EUczO6i00xljfF6xDuOZV797QRbUXE_JR-LrXg/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pbWcu/ZnJlZXBpay5jb20v/ZnJlZS1waG90by9m/cmVzaC1vcmdhbmlj/LXJlZC10b21hdG9l/cy1ibGFjay1wbGF0/ZS13aGl0ZS13b29k/ZW4tdGFibGUtd2l0/aC1ncmVlbi1yZWQt/Y2hpbGktcGVwcGVy/cy1ncmVlbi1wZXBw/ZXJzLWJsYWNrLXBl/cHBlcmNvcm5zLXNh/bHQtY2xvc2UtdXAt/aGVhbHRoeS1jb25j/ZXB0XzExNDU3OS0x/MjA0LmpwZz9zZW10/PWFpc19oeWJyaWQm/dz03NDAmcT04MA',
  category: 'Fruits & Vegetables',
  description: 'Garden fresh tomatoes, ideal for cooking and salads. Farm fresh quality.',
  rating: 4.6,
  reviews: 892,
  inventory: 350,
  features: ['Farm Fresh', 'Perfect for Cooking', 'Rich in Vitamins', 'Organic'],
},

  {
    id: '3',
    name: 'Green Apples',
    price: 180,
    originalPrice: 200,
    image: 'https://imgs.search.brave.com/QwCjm06Y5Q7DA7EisqhyhMG0qYf91qnnGcq4SHxTLPU/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9pLnBp/bmltZy5jb20vb3Jp/Z2luYWxzL2VjLzZk/L2IyL2VjNmRiMjAx/ODdlZmY4ZDE2NTI2/ZmY5ZDY3OGVmODg5/LmpwZw',
    category: 'Fruits & Vegetables',
    description: 'Crisp and juicy green apples, perfect for snacking and cooking.',
    rating: 4.7,
    reviews: 654,
    inventory: 200,
    features: ['Crisp & Juicy', 'Rich in Fiber', 'Natural Sweetness', 'Fresh'],
  },
  {
    id: '4',
    name: 'Fresh Onions',
    price: 25,
    originalPrice: 30,
    image: 'https://images.unsplash.com/photo-1508747703725-719777637510?w=400&q=80',
    category: 'Fruits & Vegetables',
    description: 'Premium quality onions, essential for Indian cooking. Fresh from farms.',
    rating: 4.5,
    reviews: 432,
    inventory: 600,
    features: ['Premium Quality', 'Essential for Cooking', 'Fresh', 'Long Lasting'],
  },
];
