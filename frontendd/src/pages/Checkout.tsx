import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
  PlusCircle
} from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import toast from 'react-hot-toast';
import BackButton from '@/components/BackButton';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// --- Types ---
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
  addresses?: Address[];
}

// --- Checkout Component ---
const Checkout: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(false);
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
    paymentMethod: 'card',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardName: '',
    upiId: '',
  });

  const [selectedAddressId, setSelectedAddressId] = useState<string | 'new'>('new');

  const { cartItems, loading: cartLoading, getTotalPrice, clearCart } = useCart();
  const authContext = useAuth(); // no generic
  const user = authContext.user as UserType | null; // ✅ cast to custom type
  const authLoading = authContext.loading;

  const navigate = useNavigate();

  // Pre-fill form with user info and first address
  useEffect(() => {
    if (!user) return;

    setFormData(prev => ({
      ...prev,
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      email: user.email || '',
      phone: user.phone || '',
    }));

    const firstAddress = user.addresses?.[0];
    if (firstAddress?._id) {
      handleAddressSelect(firstAddress._id);
    }
  }, [user]);

  const totalPrice = getTotalPrice();
  const deliveryFee = totalPrice > 200 ? 0 : 25;
  const handlingFee = totalPrice * 0.02;
  const finalTotal = totalPrice + deliveryFee + handlingFee;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (['address', 'city', 'state', 'zipCode'].includes(name)) {
      setSelectedAddressId('new');
    }
  };

  const handleAddressSelect = (addressId: string | 'new') => {
    setSelectedAddressId(addressId);

    if (addressId === 'new') {
      setFormData(prev => ({
        ...prev,
        address: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'India',
      }));
    } else {
      const selectedAddr = user?.addresses?.find(addr => addr._id === addressId);
      if (selectedAddr) {
        setFormData(prev => ({
          ...prev,
          address: selectedAddr.addressLine1,
          city: selectedAddr.city,
          state: selectedAddr.state,
          zipCode: selectedAddr.pincode,
          country: 'India',
        }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.address || !formData.city || !formData.state || !formData.zipCode) {
      toast.error("Please provide a complete shipping address.");
      return;
    }

    setIsProcessing(true);
    const toastId = toast.loading('Processing your order...');

    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      const orderId = `QK-${Date.now().toString().slice(-6)}`;
      const orderData = {
        id: orderId,
        items: cartItems,
        total: finalTotal,
        shippingAddress: {
          name: `${formData.firstName} ${formData.lastName}`,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          phone: formData.phone,
        },
        paymentMethod: formData.paymentMethod,
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('lastOrder', JSON.stringify(orderData));
      await clearCart();
      toast.success('Order placed successfully!', { id: toastId });
      navigate('/order-success');
    } catch (error: any) {
      toast.error(error.message || 'Payment failed. Please try again.', { id: toastId });
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Loading & Empty Cart ---
  if (cartLoading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Loading checkout...
      </div>
    );
  }

  if (!cartItems || cartItems.length === 0) {
    toast.error("Your cart is empty.");
    navigate('/cart');
    return null;
  }

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
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-1"> Checkout </h1>
            <p className="text-muted-foreground">Securely complete your order</p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8 xl:gap-12">
          {/* Checkout Form */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 space-y-6">
            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-6">

              {/* Address Selection */}
              {user?.addresses && user.addresses.length > 0 && (
                <Card className="shadow-md border border-border/10">
                  <CardHeader>
                    <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                      <Home className="w-5 h-5 mr-2 text-brand-primary" /> Select Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <RadioGroup value={selectedAddressId} onValueChange={handleAddressSelect}>
                      <div className="space-y-3">
                        {user.addresses.map((addr) => (
                          <Label key={addr._id} htmlFor={addr._id} className={`flex items-start space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${selectedAddressId === addr._id ? 'border-brand-primary ring-2 ring-brand-primary bg-brand-primary/5' : 'border-border hover:border-muted-foreground/50'}`}>
                            <RadioGroupItem value={addr._id} id={addr._id} className="mt-1 flex-shrink-0"/>
                            <div className="flex-1">
                              <p className="font-medium text-foreground mb-1">{user.name}</p>
                              <p className="text-sm text-muted-foreground leading-snug">
                                {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br/>
                                {addr.city}, {addr.state} - {addr.pincode}
                              </p>
                            </div>
                          </Label>
                        ))}
                        {/* New Address Option */}
                        <Label htmlFor="new-address" className={`flex items-center space-x-3 border rounded-lg p-4 cursor-pointer transition-all ${selectedAddressId === 'new' ? 'border-brand-primary ring-2 ring-brand-primary bg-brand-primary/5' : 'border-border hover:border-muted-foreground/50'}`}>
                          <RadioGroupItem value="new" id="new-address" className="flex-shrink-0"/>
                          <div className="flex items-center text-sm font-medium">
                            <PlusCircle className="w-4 h-4 mr-2" /> Use a new address or edit details below
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>
              )}

              {/* Shipping Form (New Address) */}
              {(selectedAddressId === 'new' || !user?.addresses || user.addresses.length === 0) && (
                <motion.div initial={false} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <Card className="shadow-md border border-border/10">
                    <CardHeader>
                      <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                        <MapPin className="w-5 h-5 mr-2 text-brand-primary" />
                        {user?.addresses?.length ? 'Enter New Shipping Address' : 'Shipping Information'}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <div className="relative mt-1">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none"/>
                            <Input id="firstName" name="firstName" required value={formData.firstName} onChange={handleChange} className="pl-10" placeholder="First Name"/>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <div className="relative mt-1">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none"/>
                            <Input id="lastName" name="lastName" required value={formData.lastName} onChange={handleChange} className="pl-10" placeholder="Last Name"/>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <div className="relative mt-1">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none"/>
                            <Input id="email" name="email" type="email" required value={formData.email} onChange={handleChange} className="pl-10" placeholder="Email Address"/>
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <div className="relative mt-1">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 pointer-events-none"/>
                            <Input id="phone" name="phone" type="tel" required value={formData.phone} onChange={handleChange} className="pl-10" placeholder="Phone Number"/>
                          </div>
                        </div>
                        <div className="md:col-span-2">
                          <Label htmlFor="address">Address</Label>
                          <Input id="address" name="address" required value={formData.address} onChange={handleChange} className="mt-1" placeholder="Street Address, Apt, Suite"/>
                        </div>
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input id="city" name="city" required value={formData.city} onChange={handleChange} className="mt-1"/>
                        </div>
                        <div>
                          <Label htmlFor="state">State</Label>
                          <Input id="state" name="state" required value={formData.state} onChange={handleChange} className="mt-1"/>
                        </div>
                        <div>
                          <Label htmlFor="zipCode">ZIP / Pincode</Label>
                          <Input id="zipCode" name="zipCode" required value={formData.zipCode} onChange={handleChange} className="mt-1"/>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Payment Info */}
              <Card className="shadow-md border border-border/10">
                <CardHeader>
                  <CardTitle className="text-xl font-semibold text-foreground flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-brand-primary" /> Payment Method
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {/* Payment selection logic */}
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="mt-6">
                <Button type="submit" form="checkout-form" disabled={isProcessing} className="btn-hero w-full text-lg py-3">
                  {isProcessing
                    ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                    : <><Lock className="w-4 h-4 mr-2" /> Pay ₹{finalTotal.toFixed(2)} Securely</>}
                </Button>
              </div>
            </form>
          </motion.div>

          {/* Order Summary */}
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="lg:sticky lg:top-8 h-fit lg:col-span-1">
            <Card className="shadow-md border border-border/10">
              <CardHeader><CardTitle className="text-xl font-semibold text-foreground">Order Summary</CardTitle></CardHeader>
              <CardContent>
                {cartItems.map(item => (
                  <div key={item._id} className="flex items-center space-x-3 mb-2">
                    <div className="w-14 h-14 bg-muted rounded-lg overflow-hidden flex-shrink-0 border border-border/10">
                      <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-foreground text-sm truncate">{item.name}</h4>
                      <p className="text-xs text-muted-foreground">Qty: {item.qty}</p>
                    </div>
                    <p className="font-semibold text-foreground text-sm flex-shrink-0">₹{(item.price * item.qty).toFixed(2)}</p>
                  </div>
                ))}
                <div className="border-t border-border/10 pt-3 mt-3 space-y-1">
                  <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>₹{totalPrice.toFixed(2)}</span></div>
                  <div className="flex justify-between text-sm text-muted-foreground"><span>Delivery Fee</span><span className={deliveryFee === 0 ? 'text-brand-success font-medium' : ''}>{deliveryFee === 0 ? 'Free' : `₹${deliveryFee.toFixed(2)}`}</span></div>
                  <div className="flex justify-between text-sm text-muted-foreground"><span>Platform Fee</span><span>₹{handlingFee.toFixed(2)}</span></div>
                  <div className="flex justify-between text-lg font-bold text-foreground"><span>Order Total</span><span>₹{finalTotal.toFixed(2)}</span></div>
                </div>
                <div className="mt-6 flex items-center space-x-2 text-xs text-muted-foreground"><Lock className="w-3 h-3"/> <span>Secure SSL Encrypted Payment</span></div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;