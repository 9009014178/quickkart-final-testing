import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, ShoppingCart } from 'lucide-react';
import { Product } from '@/services/productService';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';



// 👇 Backend base URL (API + images)
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function getProductImageUrl(product: Product) {
  // Your seeded products use `image`
  // Some older ones might use `imageUrl` or `images[0]`
  const anyProduct = product as any;

  const raw: string =
    anyProduct.image ||
    anyProduct.imageUrl ||
    (Array.isArray(anyProduct.images) ? anyProduct.images[0] : '');

  // If nothing, show placeholder
  if (!raw) return '/placeholder-product.png';

  // If already full URL (Cloudinary etc.)
  if (raw.startsWith('http')) return raw;

  // If backend sent "/uploads/..." or "uploads/..."
  return `${API_BASE_URL}${raw.startsWith('/') ? raw : `/${raw}`}`;
}

interface ProductCardProps {
  product: Product;
  index?: number;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, index = 0 }) => {
  const { addToCart } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    addToCart(
      {
        _id: product._id,
        name: product.name,
        price: product.salePrice || product.price,
        // ✅ use the same helper so cart items also have a valid image URL
        image: getProductImageUrl(product),
      },
      1
    );
  };

  const isInStock = product.isAvailable && product.stock > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      whileHover={{ y: -5 }}
      className="group flex flex-col h-full"
    >
      <Link to={`/product/${product._id}`} className="block flex-grow">
        <div className="product-card relative overflow-hidden h-full flex flex-col">
          {/* Discount Badge */}
          {product.salePrice && product.price > product.salePrice && (
            <div className="absolute top-4 left-4 z-10 bg-brand-error text-white text-xs font-bold px-2 py-1 rounded-full">
              {Math.round(
                ((product.price - product.salePrice) / product.price) * 100
              )}
              % OFF
            </div>
          )}

          {/* Product Image */}
          <div className="relative aspect-square mb-4 overflow-hidden rounded-xl bg-muted">
            <img
              src={getProductImageUrl(product)}
              alt={product.name}
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
            />

            {/* Add to Cart Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileHover={{ opacity: 1, y: 0 }}
              className={`absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${
                !isInStock ? 'cursor-not-allowed' : ''
              }`}
            >
              <Button
                onClick={handleAddToCart}
                className={`btn-hero transform scale-95 hover:scale-100 ${
                  !isInStock ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={!isInStock}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                {isInStock ? 'Add to Cart' : 'Out of Stock'}
              </Button>
            </motion.div>
          </div>

          {/* Product Info */}
          <div className="space-y-2 flex-grow flex flex-col justify-between">
            <div>
              {/* Rating */}
              <div className="flex items-center space-x-1">
                <div className="flex items-center">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-3 h-3 ${
                        i < Math.floor(product.rating || 0)
                          ? 'text-yellow-400 fill-current'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground">
                  ({product.numReviews || 0})
                </span>
              </div>

              <h3 className="font-semibold text-foreground line-clamp-2 group-hover:text-brand-primary transition-colors">
                {product.name}
              </h3>
            </div>

            {/* Price & Stock */}
            <div className="mt-auto pt-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <span className="text-lg font-bold text-brand-primary">
                    ₹{(product.salePrice || product.price).toFixed(2)}
                  </span>
                  {product.salePrice && (
                    <span className="text-sm text-muted-foreground line-through">
                      ₹{product.price.toFixed(2)}
                    </span>
                  )}
                </div>

                <span
                  className={`text-xs px-2 py-1 rounded-full ${
                    isInStock
                      ? 'bg-brand-success/20 text-brand-success'
                      : 'bg-brand-error/20 text-brand-error'
                  }`}
                >
                  {isInStock ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default ProductCard;
