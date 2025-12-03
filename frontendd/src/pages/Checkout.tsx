// src/pages/Checkout.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Lock,
  MapPin,
  User,
  Phone,
  Mail,
  Loader2,
  Home,
  PlusCircle,
  Smartphone,
  Wallet,
} from 'lucide-react';

import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BackButton from '@/components/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import toast from 'react-hot-toast';
import api from '@/services/api';

// ---------- Types ----------
interface Address {
  _id: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

interface UserType {
  _id: string;
  name: string;
  email: string;
  phone?: string;
}

// ---------- Component ----------
const Checkout: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] =
    useState<string | 'new'>('new');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'India',
    paymentMethod: 'card', // 'card' | 'upi' | 'cod'
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    upiId: '',
  });

  const { cartItems, loading: cartLoading, getTotalPrice, clearCart } =
    useCart();
  const { user, loading: authLoading } = useAuth() as {
    user: UserType | null;
    loading: boolean;
  };

  const navigate = useNavigate();
  const location = useLocation();

  // Prefill basic user data
  useEffect(() => {
    if (!user) return;
    setFormData((prev) => ({
      ...prev,
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email || '',
      phone: user.phone || '',
    }));
  }, [user]);

  // Load saved addresses (same endpoint as Manage Addresses)
  useEffect(() => {
    const loadAddresses = async () => {
      if (!user) return;
      try {
        // ⬇️ If your manage-address page uses a different URL, change this line
        const { data } = await api.get<Address[]>('/api/users/addresses');

        console.log('Loaded addresses for checkout:', data);
        setAddresses(data || []);

        if (data && data.length > 0) {
          const first = data[0];
          setSelectedAddressId(first._id);
          setFormData((prev) => ({
            ...prev,
            address: first.addressLine1,
            city: first.city,
            state: first.state,
            zipCode: first.pincode,
            country: 'India',
          }));
        } else {
          setSelectedAddressId('new');
        }
      } catch (err) {
        console.error('Failed to load addresses:', err);
      }
    };

    loadAddresses();
  }, [user?._id, user]);

  const totalPrice = getTotalPrice();
  const deliveryFee = totalPrice > 200 ? 0 : 25;
  const handlingFee = totalPrice * 0.02;
  const finalTotal = totalPrice + deliveryFee + handlingFee;

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // If user edits address fields, treat as new address
    if (['address', 'city', 'state', 'zipCode'].includes(name)) {
      setSelectedAddressId('new');
    }
  };

  const handleAddressSelect = (addressId: string | 'new') => {
    setSelectedAddressId(addressId);

    if (addressId === 'new') {
      setFormData((prev) => ({
        ...prev,
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India',
      }));
    } else {
      const selected = addresses.find((a) => a._id === addressId);
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          address: selected.addressLine1,
          city: selected.city,
          state: selected.state,
          zipCode: selected.pincode,
          country: 'India',
        }));
      }
    }
  };

  // Checkout.tsx

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!selectedAddressId || selectedAddressId === 'new') {
    toast.error('Please select a saved address for now.');
    return;
  }

  if (!formData.address || !formData.city || !formData.state || !formData.zipCode) {
    toast.error('Please provide a complete shipping address.');
    return;
  }

  if (!user?._id) {
    toast.error('You must be logged in to place an order.');
    return;
  }

  if (!cartItems || cartItems.length === 0) {
    toast.error('Your cart is empty.');
    return;
  }

  setIsProcessing(true);
  const toastId = toast.loading('Placing your order...');

  try {
    // Build minimal orderItems payload for backend
    const orderItems = cartItems.map((item) => ({
      product: item._id,
      name: item.name,
      price: item.price,
      qty: item.qty,
      image: item.image || '',
    }));

    const payload = {
      shippingAddressId: selectedAddressId,   // from radio group
      paymentMethod: 'Cash on Delivery',     // you can wire real payment later
      couponCode: null,                      // or actual coupon if you have it
      orderItems,
      // latitude / longitude are optional on backend now
    };

    const response = await api.post('/api/orders', payload);
    const createdOrder = response.data;

    // Save last order id so success page can still show it after refresh
    localStorage.setItem('lastOrderId', createdOrder._id);

    toast.success('Order placed successfully!', { id: toastId });
    setIsProcessing(false);

    // ✅ Pass orderId via router state
    navigate('/order-success', {
      state: { orderId: createdOrder._id },
    });
  } catch (error: any) {
    console.error('Order creation failed:', error);
    toast.error(
      error?.response?.data?.message ||
        error?.message ||
        'Failed to place order. Please try again.',
      { id: toastId }
    );
    setIsProcessing(false);
  }
};



  // ---------- Loading / Empty ----------
  if (cartLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading checkout...
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <p className="text-lg mb-4">Your cart is empty.</p>
        <Button onClick={() => navigate('/products')}>Go to Products</Button>
      </div>
    );
  }

  // ---------- JSX ----------
  return (
    <div className="min-h-screen py-8 bg-gradient-to-b from-background via-secondary/10 to-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-4"
        >
          <BackButton />
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-1">
              Checkout
            </h1>
            <p className="text-muted-foreground">
              Securely complete your order
            </p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 xl:gap-12">
          {/* LEFT: Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2 space-y-6"
          >
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Saved address selection */}
              {addresses.length > 0 && (
                <Card className="shadow-md border border-border/10">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                      <Home className="w-5 h-5 mr-2 text-brand-primary" /> Select
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup
                      value={selectedAddressId}
                      onValueChange={handleAddressSelect}
                    >
                      <div className="space-y-3">
                        {addresses.map((addr) => (
                          <Label
                            key={addr._id}
                            htmlFor={addr._id}
                            className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
                              selectedAddressId === addr._id
                                ? 'border-brand-primary ring-2 ring-brand-primary bg-brand-primary/5'
                                : 'border-border hover:border-muted-foreground/50'
                            }`}
                          >
                            <RadioGroupItem
                              value={addr._id}
                              id={addr._id}
                              className="mt-1 flex-shrink-0"
                            />
                            <div className="flex-1">
                              <p className="font-medium text-foreground mb-1">
                                {user?.name}
                              </p>
                              <p className="text-sm text-muted-foreground leading-snug">
                                {addr.addressLine1}
                                {addr.addressLine2
                                  ? `, ${addr.addressLine2}`
                                  : ''}
                                <br />
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                            </div>
                          </Label>
                        ))}

                        {/* New address option */}
                        <Label
                          htmlFor="new-address"
                          className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${
                            selectedAddressId === 'new'
                              ? 'border-brand-primary ring-2 ring-brand-primary bg-brand-primary/5'
                              : 'border-border hover:border-muted-foreground/50'
                          }`}
                        >
                          <RadioGroupItem
                            value="new"
                            id="new-address"
                            className="flex-shrink-0"
                          />
                          <div className="flex items-center text-sm font-medium">
                            <PlusCircle className="w-4 h-4 mr-2" /> Use a new
                            address or edit details below
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {/* Shipping info / new address form */}
              {(selectedAddressId === 'new' || addresses.length === 0) && (
                <motion.div
                  initial={false}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <Card className="shadow-md border border-border/10">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-brand-primary" />
                        {addresses.length
                          ? 'Shipping Information (New Address)'
                          : 'Shipping Information'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <div className="relative mt-1">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                            <Input
                              id="firstName"
                              name="firstName"
                              required
                              value={formData.firstName}
                              onChange={handleChange}
                              className="pl-10"
                              placeholder="First Name"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <div className="relative mt-1">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                            <Input
                              id="lastName"
                              name="lastName"
                              required
                              value={formData.lastName}
                              onChange={handleChange}
                              className="pl-10"
                              placeholder="Last Name"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <div className="relative mt-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                            <Input
                              id="email"
                              name="email"
                              type="email"
                              required
                              value={formData.email}
                              onChange={handleChange}
                              className="pl-10"
                              placeholder="Email Address"
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <div className="relative mt-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none" />
                            <Input
                              id="phone"
                              name="phone"
                              type="tel"
                              required
                              value={formData.phone}
                              onChange={handleChange}
                              className="pl-10"
                              placeholder="Phone Number"
                            />
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            name="address"
                            required
                            value={formData.address}
                            onChange={handleChange}
                            className="mt-1"
                            placeholder="Street Address, Apt, Suite"
                          />
                        </div>
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            name="city"
                            required
                            value={formData.city}
                            onChange={handleChange}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            name="state"
                            required
                            value={formData.state}
                            onChange={handleChange}
                            className="mt-1"
                          />
                        </div>
                        <div>
                          <Label htmlFor="zipCode">ZIP / Pincode</Label>
                          <Input
                            id="zipCode"
                            name="zipCode"
                            required
                            value={formData.zipCode}
                            onChange={handleChange}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Payment Method */}
              <Card className="shadow-md border border-border/10">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-brand-primary" />{' '}
                    Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RadioGroup
                    value={formData.paymentMethod}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        paymentMethod: value,
                      }))
                    }
                    className="space-y-3"
                  >
                    <Label
                      htmlFor="pm-card"
                      className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-all ${
                        formData.paymentMethod === 'card'
                          ? 'border-brand-primary ring-2 ring-brand-primary bg-brand-primary/5'
                          : 'border-border hover:border-muted-foreground/50'
                      }`}
                    >
                      <RadioGroupItem value="card" id="pm-card" />
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Card (Online)
                        </span>
                      </div>
                    </Label>

                    <Label
                      htmlFor="pm-upi"
                      className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-all ${
                        formData.paymentMethod === 'upi'
                          ? 'border-brand-primary ring-2 ring-brand-primary bg-brand-primary/5'
                          : 'border-border hover:border-muted-foreground/50'
                      }`}
                    >
                      <RadioGroupItem value="upi" id="pm-upi" />
                      <div className="flex items-center space-x-2">
                        <Smartphone className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          UPI (Online)
                        </span>
                      </div>
                    </Label>

                    <Label
                      htmlFor="pm-cod"
                      className={`flex items-center space-x-3 border rounded-lg p-3 cursor-pointer transition-all ${
                        formData.paymentMethod === 'cod'
                          ? 'border-brand-primary ring-2 ring-brand-primary bg-brand-primary/5'
                          : 'border-border hover:border-muted-foreground/50'
                      }`}
                    >
                      <RadioGroupItem value="cod" id="pm-cod" />
                      <div className="flex items-center space-x-2">
                        <Wallet className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          Cash on Delivery
                        </span>
                      </div>
                    </Label>
                  </RadioGroup>

                  <p className="mt-3 text-xs text-muted-foreground">
                    Online methods are currently mocked; orders are created as
                    &quot;Online&quot; payments, or &quot;Cash on Delivery&quot; when
                    selected.
                  </p>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="mt-6">
                <Button
                  type="submit"
                  form="checkout-form"
                  disabled={isProcessing}
                  className="btn-hero w-full text-lg py-3"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />{' '}
                      Processing...
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 mr-2" /> Pay ₹
                      {finalTotal.toFixed(2)} Securely
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>

          {/* RIGHT: Summary */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:sticky lg:top-8 h-fit lg:col-span-1"
          >
            <Card className="shadow-md border border-border/10">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-foreground">
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent>
                {cartItems.map((item: any) => (
                  <div
                    key={item._id}
                    className="flex items-center space-x-3 mb-2"
                  >
                    <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-border/10">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm truncate">
                        {item.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        Qty: {item.qty}
                      </p>
                    </div>
                    <p className="font-semibold text-foreground text-sm flex-shrink-0">
                      ₹{(item.price * item.qty).toFixed(2)}
                    </p>
                  </div>
                ))}

                <div className="border-t border-border/10 pt-3 mt-3 space-y-1">
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Subtotal</span>
                    <span>₹{totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Delivery Fee</span>
                    <span
                      className={
                        deliveryFee === 0
                          ? 'text-brand-success font-medium'
                          : ''
                      }
                    >
                      {deliveryFee === 0
                        ? 'Free'
                        : `₹${deliveryFee.toFixed(2)}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>Platform Fee</span>
                    <span>₹{handlingFee.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold text-foreground">
                    <span>Order Total</span>
                    <span>₹{finalTotal.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-6 flex items-center space-x-2 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" />
                  <span>Secure SSL Encrypted Payment</span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
