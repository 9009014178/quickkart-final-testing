import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, User, Menu, X, Search, MapPin } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { useLocation as usePincodeLocation } from '@/contexts/LocationContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import ThemeToggle from '@/components/ThemeToggle';
import toast from 'react-hot-toast';

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { user, logout } = useAuth();

  // ✅ use totalItems directly from CartContext
  const { totalItems } = useCart();

  const location = useLocation();
  const navigate = useNavigate();

  // --- Pincode state ---
  const { pincode, setPincode } = usePincodeLocation();
  const [pincodeInput, setPincodeInput] = useState(pincode || '');

  useEffect(() => {
    setPincodeInput(pincode || '');
  }, [pincode]);

  const handleSetPincode = (e?: React.FormEvent) => {
    e?.preventDefault();
    const trimmed = pincodeInput.trim();
    if (/^\d{6}$/.test(trimmed)) {
      setPincode(trimmed);
      toast.success(`Location set to ${trimmed}`);
      setIsMenuOpen(false);
    } else {
      toast.error('Please enter a valid 6-digit pincode');
    }
  };

  // --- Menu and Search ---
  const toggleMenu = () => setIsMenuOpen((prev) => !prev);
  const toggleSearch = () => setIsSearchOpen((prev) => !prev);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    navigate(`/products?keyword=${encodeURIComponent(query)}`);
    setSearchQuery('');
    setIsSearchOpen(false);
  };

  const menuItems = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'About', path: '/about' },
    { name: 'Contact', path: '/contact' },
  ];

  return (
    <nav className="bg-background/95 backdrop-blur-md border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 flex-shrink-0">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">Q</span>
            </div>
            <span className="text-xl font-bold gradient-text hidden sm:inline">
              Quick-Kart
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
            {menuItems.map((item) => (
              <Link
                key={item.name}
                to={item.path}
                className={`text-sm font-medium text-foreground hover:text-brand-primary transition-colors duration-200 relative ${
                  location.pathname === item.path ? 'text-brand-primary' : ''
                }`}
              >
                {item.name}
                {location.pathname === item.path && (
                  <motion.div
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-brand-primary"
                    layoutId="activeTab"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </Link>
            ))}
          </div>

          {/* Right Actions */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Desktop Pincode */}
            <form
              onSubmit={handleSetPincode}
              className="hidden lg:flex items-center gap-2"
            >
              <MapPin className="h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Pincode"
                className="w-24 h-9 text-sm"
                value={pincodeInput}
                onChange={(e) => setPincodeInput(e.target.value)}
                maxLength={6}
                pattern="\d{6}"
                title="Enter 6-digit pincode"
              />
              <Button
                type="submit"
                size="sm"
                variant="outline"
                className="h-9 text-sm"
              >
                Set
              </Button>
            </form>

            <ThemeToggle />

            {/* Search */}
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex"
                onClick={toggleSearch}
              >
                <Search className="h-5 w-5" />
              </Button>
              <AnimatePresence>
                {isSearchOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-12 w-64 sm:w-80 bg-background border border-border rounded-lg shadow-lg p-4 z-50"
                  >
                    <form onSubmit={handleSearch} className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Search products..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="flex-1"
                        autoFocus
                      />
                      <Button type="submit" size="sm">
                        Search
                      </Button>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Cart */}
            <Link to="/cart" className="relative">
              <Button variant="ghost" size="icon">
                <ShoppingCart className="h-5 w-5" />
                {totalItems > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="cart-badge"
                  >
                    {totalItems}
                  </motion.span>
                )}
              </Button>
            </Link>

            {/* User */}
            {user ? (
              <div className="hidden sm:flex items-center space-x-2">
                <Link to="/dashboard">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="My Account"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="hidden sm:flex items-center space-x-2">
                <Link to="/login">
                  <Button variant="ghost">Login</Button>
                </Link>
                <Link to="/signup">
                  <Button className="btn-hero">Sign Up</Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-t border-border"
          >
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Pincode */}
              <form onSubmit={handleSetPincode} className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Enter Pincode"
                  className="flex-1"
                  value={pincodeInput}
                  onChange={(e) => setPincodeInput(e.target.value)}
                  maxLength={6}
                  pattern="\d{6}"
                  title="Enter 6-digit pincode"
                />
                <Button type="submit" variant="outline">
                  Set
                </Button>
              </form>
              <div className="border-t border-border"></div>

              {/* Mobile Menu Links */}
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block text-foreground hover:text-brand-primary transition-colors ${
                    location.pathname === item.path ? 'text-brand-primary' : ''
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile User */}
              {user ? (
                <div className="border-t border-border pt-4 space-y-2">
                  <p className="text-sm text-muted-foreground mb-2">
                    Hi, {user.name}
                  </p>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      My Account
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    onClick={logout}
                    className="w-full justify-start text-red-500"
                  >
                    Logout
                  </Button>
                </div>
              ) : (
                <div className="border-t border-border pt-4 space-y-2">
                  <Link to="/login" onClick={() => setIsMenuOpen(false)}>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                    >
                      Login
                    </Button>
                  </Link>
                  <Link to="/signup" onClick={() => setIsMenuOpen(false)}>
                    <Button className="btn-hero w-full">Sign Up</Button>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
