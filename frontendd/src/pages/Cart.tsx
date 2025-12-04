import React from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import BackButton from '@/components/BackButton';
import { Button } from '@/components/ui/button';
import { getImageUrl } from '@/utils/image';


const Cart: React.FC = () => {
  const {
    cartItems,
    loading,
    updateCartItemQuantity,
    removeFromCart,
    getTotalItems,
    getTotalPrice,
  } = useCart();

  const { isAuthenticated } = useAuth();

  // Make sure these are always numbers (no undefined / NaN crashes)
  const totalItems: number =
    typeof getTotalItems === 'function' ? getTotalItems() : 0;

  const rawTotalPrice =
    typeof getTotalPrice === 'function' ? getTotalPrice() : 0;

  const totalPrice: number = Number.isFinite(rawTotalPrice)
    ? rawTotalPrice
    : 0;

  // ------------------ Loading State ------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        Loading your cart...
      </div>
    );
  }

  // ------------------ Empty Cart State ------------------
  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center p-4"
        >
          <div className="flex justify-center mb-8">
            <BackButton />
          </div>
          <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-12 h-12 text-muted-foreground" />
          </div>
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Your cart is empty
          </h1>
          <p className="text-muted-foreground mb-8">
            Looks like you haven't added any items yet.
          </p>
          <Link to="/products">
            <Button className="btn-hero">Start Shopping</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  // ------------------ Cart with Items ------------------
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <BackButton />
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-1">
              Shopping Cart
            </h1>
            <p className="text-muted-foreground">
              {totalItems} {totalItems === 1 ? 'item' : 'items'} in your cart
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">

          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            <AnimatePresence>
              {cartItems.map((item) => {
                const unitPrice =
                  item.price ??
                  item.product?.price ??
                  0;

                const lineTotal = unitPrice * (item.qty ?? item.quantity ?? 0);

                return (
                  <motion.div
                    key={item._id}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50, transition: { duration: 0.3 } }}
                    className="bg-card rounded-2xl p-4 md:p-6 flex gap-4 items-center border border-border/10 shadow-sm"
                  >
                    {/* Product Image */}
                    <div className="w-20 h-20 md:w-24 md:h-24 bg-muted rounded-xl overflow-hidden flex-shrink-0 border border-border/10">
                      <img
                        src={getImageUrl(item)}
                        alt={item.product?.name || item.name || 'Product'}
                        className="w-16 h-16 rounded object-cover border border-border/10"
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1 truncate">
                        {item.product?.name || item.name || 'Product'}
                      </h3>
                      <p className="text-sm text-muted-foreground mb-1">
                        Price: ₹{unitPrice.toFixed(2)}
                      </p>
                      <p className="text-brand-primary font-bold text-lg md:hidden">
                        ₹{lineTotal.toFixed(2)}
                      </p>
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center space-x-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updateCartItemQuantity(
                            item._id,
                            Math.max(1, (item.qty ?? item.quantity ?? 1) - 1)
                          )
                        }
                        className="h-8 w-8 rounded-full"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-4 h-4" />
                      </Button>
                      <span className="w-8 text-center font-semibold">
                        {item.qty ?? item.quantity}
                      </span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                          updateCartItemQuantity(
                            item._id,
                            (item.qty ?? item.quantity ?? 0) + 1
                          )
                        }
                        className="h-8 w-8 rounded-full"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>

                    {/* Item Total */}
                    <div className="text-right min-w-[80px] hidden md:block flex-shrink-0">
                      <p className="font-bold text-foreground">
                        ₹{lineTotal.toFixed(2)}
                      </p>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeFromCart(item._id)}
                      className="text-muted-foreground hover:text-brand-error flex-shrink-0 rounded-full"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          {/* Order Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="bg-card rounded-2xl p-6 sticky top-24 border border-border/10 shadow-sm">
              <h2 className="text-xl font-bold text-foreground mb-6">
                Order Summary
              </h2>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal ({totalItems} items)</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>Delivery Fee</span>
                  <span
                    className={
                      totalPrice > 200 ? 'text-brand-success' : ''
                    }
                  >
                    {totalPrice > 200 ? 'Free' : '₹25.00'}
                  </span>
                </div>

                <div className="flex justify-between text-muted-foreground">
                  <span>Platform Fee</span>
                  <span>₹{(totalPrice * 0.02).toFixed(2)}</span>
                </div>

                <div className="border-t border-border pt-4 mt-4">
                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>Order Total</span>
                    <span>
                      ₹{(
                        totalPrice +
                        (totalPrice > 200 ? 0 : 25) +
                        totalPrice * 0.02
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {totalPrice > 0 && totalPrice < 200 && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="bg-brand-success/10 border border-brand-success/20 rounded-lg p-3 mb-6 text-center"
                >
                  <p className="text-sm text-brand-success font-medium">
                    Add ₹{(200 - totalPrice).toFixed(2)} more for FREE delivery!
                  </p>
                </motion.div>
              )}

              <div className="space-y-3">
                {isAuthenticated ? (
                  <Link to="/checkout">
                    <Button className="btn-hero w-full text-base py-3">
                      Proceed to Checkout
                    </Button>
                  </Link>
                ) : (
                  <div className="space-y-2">
                    <Link to="/login" state={{ from: '/checkout' }}>
                      <Button className="btn-hero w-full text-base py-3">
                        Login to Checkout
                      </Button>
                    </Link>
                    <p className="text-xs text-center text-muted-foreground">
                      New customer?{' '}
                      <Link
                        to="/signup"
                        className="text-brand-primary hover:underline font-medium"
                      >
                        Create an account
                      </Link>
                    </p>
                  </div>
                )}
                <Link to="/products">
                  <Button variant="outline" className="w-full">
                    Continue Shopping
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Cart;
