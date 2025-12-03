import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Grid, List } from 'lucide-react';
import { productService, Product } from '@/services/productService';
import { useCart } from '@/contexts/CartContext';
import toast from 'react-hot-toast';
import ProductCard from '@/components/ProductCard';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const categories = [
  'All',
  'Fruits & Vegetables',
  'Dairy & Eggs',
  'Snacks & Beverages',
  'Personal Care',
  'Household Items',
  'Instant Food',
];

const Products = () => {
  const [searchParams] = useSearchParams();
  const { addToCart } = useCart();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Load ?keyword=something from URL
  useEffect(() => {
    const searchQuery = searchParams.get('keyword');
    if (searchQuery) setSearchTerm(searchQuery);
  }, [searchParams]);

  // Fetch products whenever filters change
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);

      try {
        const filters = {
          keyword: searchTerm || undefined,
          category: selectedCategory === 'All' ? undefined : selectedCategory,
          sortBy,
        };

        const data = await productService.getProducts(filters);
        setProducts(data || []);
      } catch (error: any) {
        toast.error(error.message || 'Failed to fetch products');
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);

  }, [searchTerm, selectedCategory, sortBy]);

  // Add to cart
  const handleAddToCart = (product: Product) => {
    addToCart(
      {
        _id: product._id,
        name: product.name,
        price: product.salePrice || product.price,
        image: product.image,
      },
      1
    );
  };

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1"
          >
            <h1 className="text-3xl lg:text-4xl font-bold mb-2">Our Products</h1>
            <p className="text-muted-foreground">Discover our complete collection</p>
          </motion.div>
        </div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 mb-8 space-y-4"
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Categories + Sorting */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <Button
                  key={category}
                  size="sm"
                  variant={selectedCategory === category ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>

            {/* Sorting + View */}
            <div className="flex items-center gap-4">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-2 bg-input border rounded-lg"
              >
                <option value="-createdAt">Newest</option>
                <option value="price">Price: Low → High</option>
                <option value="-price">Price: High → Low</option>
                <option value="-rating">Highest Rated</option>
                <option value="name">Name A → Z</option>
              </select>

              <div className="flex border rounded-lg overflow-hidden">
                <Button
                  size="sm"
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('grid')}
                >
                  <Grid className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  onClick={() => setViewMode('list')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>

          </div>
        </motion.div>

        {/* Loading */}
        {loading && <div className="text-center py-12">Loading products...</div>}

        {/* Count */}
        {!loading && (
          <p className="text-muted-foreground mb-6">
            Showing {products.length} products
          </p>
        )}

        {/* Product List */}
        {!loading && products.length > 0 && (
          <div
            className={
              viewMode === 'grid'
                ? "grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                : "space-y-4"
            }
          >
            {products.map((product, index) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                {viewMode === "grid" ? (
                  <ProductCard product={product} index={index} />
                ) : (
                  <div className="bg-card rounded-2xl p-6 flex gap-6 items-center border">
                    <Link to={`/product/${product._id}`}>
                      <img
                        src={product.image}
                        className="w-28 h-28 rounded-xl object-cover"
                        alt={product.name}
                      />
                    </Link>

                    <div className="flex-1">
                      <Link to={`/product/${product._id}`}>
                        <h3 className="font-semibold">{product.name}</h3>
                      </Link>

                      <p className="text-muted-foreground text-sm line-clamp-2 mb-3">
                        {product.description}
                      </p>

                      <div className="flex justify-between items-center">
                        <span className="text-xl font-bold text-brand-primary">
                          ₹{(product.salePrice || product.price).toFixed(2)}
                        </span>

                        <Button
                          className="btn-hero"
                          onClick={() => handleAddToCart(product)}
                          disabled={!product.isAvailable}
                        >
                          {product.isAvailable ? "Add to Cart" : "Out of Stock"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && products.length === 0 && (
          <div className="text-center py-12">
            <Search className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-lg font-semibold mt-4">No products found</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default Products;