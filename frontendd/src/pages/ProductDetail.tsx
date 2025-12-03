import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Heart, Share2, ShoppingCart, ArrowLeft, Truck, Shield, RotateCcw } from 'lucide-react';
import { productService, Product } from '@/services/productService';
import { useCart } from '@/contexts/CartContext';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';
import toast from 'react-hot-toast';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        toast.error("Invalid product link.");
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const fetchedProduct = await productService.getProductById(id);
        setProduct(fetchedProduct);

        if (fetchedProduct?.category) {
          const relatedData = await productService.getProducts({ category: fetchedProduct.category });
          setRelatedProducts(relatedData.filter(p => p._id !== id).slice(0, 4));
        }

      } catch (error: any) {
        toast.error(error.response?.data?.message || "Could not load product details.");
        setProduct(null);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;

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

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading product...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
          <Link to="/products">
            <Button>
              <ArrowLeft className="mr-2" /> Back to Products
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const isAvailable = product.isAvailable;
  const discountPercentage = product.salePrice
    ? Math.round(((product.price - product.salePrice) / product.price) * 100)
    : 0;

  const benefits = [
    { icon: Truck, text: 'Free delivery over ₹200' },
    { icon: Shield, text: 'Quality Assurance Guarantee' },
    { icon: RotateCcw, text: '7-day easy return' },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4">
        
        {/* Breadcrumb */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} 
          className="flex items-center gap-2 text-sm text-muted-foreground mb-8">
          <Link to="/" className="hover:text-brand-primary">Home</Link>
          <span>/</span>
          <Link to="/products" className="hover:text-brand-primary">Products</Link>
          <span>/</span>
          <span>{product.name}</span>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">

          {/* LEFT IMAGES */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }}>
            <div className="aspect-square rounded-xl overflow-hidden bg-muted shadow">
              <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
            </div>
          </motion.div>

          {/* RIGHT SIDE INFO */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
            
            {/* Category + Discount */}
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-brand-primary/10 text-brand-primary text-sm">
                {product.category}
              </span>

              {discountPercentage > 0 && (
                <span className="px-3 py-1 rounded-full bg-red-500 text-white text-sm font-bold">
                  {discountPercentage}% OFF
                </span>
              )}
            </div>

            <h1 className="text-3xl font-bold">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`w-5 h-5 ${i < Math.floor(product.rating) ? "text-yellow-400" : "text-gray-300"}`} />
                ))}
              </div>
              <span>({product.numReviews || 0} reviews)</span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-4">
              <span className="text-3xl font-bold text-brand-primary">
                ₹{(product.salePrice || product.price).toFixed(2)}
              </span>

              {product.salePrice && (
                <span className="line-through text-muted-foreground text-xl">
                  ₹{product.price.toFixed(2)}
                </span>
              )}
            </div>

            <p className="text-muted-foreground text-lg">{product.description}</p>

            {/* Stock */}
            <span
              className={`px-3 py-1 rounded-full text-sm ${
                isAvailable ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              }`}
            >
              {isAvailable ? "✓ In Stock" : "✗ Out of Stock"}
            </span>

            {/* Buttons */}
            <div className="flex gap-4">
              <Button onClick={handleAddToCart} disabled={!isAvailable} className="flex-1">
                <ShoppingCart className="mr-2" />
                {isAvailable ? "Add to Cart" : "Unavailable"}
              </Button>

              <Button variant="outline" size="icon"><Heart /></Button>
              <Button variant="outline" size="icon"><Share2 /></Button>
            </div>

            {/* Benefits */}
            <div className="pt-4 border-t space-y-3">
              {benefits.map((b, i) => (
                <div key={i} className="flex items-center gap-3">
                  <b.icon className="text-brand-primary w-5 h-5" />
                  <span className="text-muted-foreground">{b.text}</span>
                </div>
              ))}
            </div>

          </motion.div>

        </div>

        {/* RELATED PRODUCTS */}
        {relatedProducts.length > 0 && (
          <section className="py-16">
            <h2 className="text-2xl font-bold mb-6">Related Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {relatedProducts.map((p, i) => (
                <ProductCard key={p._id} product={p} index={i} />
              ))}
            </div>
          </section>
        )}

        {/* BACK */}
        <div className="text-center mt-10">
          <Link to="/products">
            <Button variant="outline">
              <ArrowLeft className="mr-2" /> Back to Products
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
};

export default ProductDetail;
