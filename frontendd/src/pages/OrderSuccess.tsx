// src/pages/OrderSuccess.tsx
import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Home, Loader2, ShoppingBag } from 'lucide-react';
import api from '@/services/api';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { getProductImageUrl } from '@/utils/productImage';
import { Product } from '@/services/productService';

function getOrderItemImageUrl(item: any): string {
  // If the backend stored a direct image string on the order item (cart → order)
  if (item.image) {
    return item.image; // this should already be a full URL from getProductImageUrl
  }

  // If the backend populated `product` object inside each order item
  if (item.product && typeof item.product === 'object') {
    return getProductImageUrl(item.product as Product);
  }

  // Fallback
  return '/placeholder-product.png';
}

interface OrderItem {
  _id: string;
  name: string;
  qty: number;
  price: number;
  image?: string;
  product?: any;
}

interface ShippingAddress {
  addressLine1: string;
  city: string;
  state: string;
  pincode: string;
}

interface Order {
  _id: string;
  createdAt: string;
  totalPrice: number;
  paymentMethod: string;
  orderItems: OrderItem[];
  shippingAddress: ShippingAddress;
}

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const state = location.state as { orderId?: string } | null;
  const [orderId, setOrderId] = useState<string | null>(state?.orderId || null);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Get orderId either from router state or from localStorage (page refresh)
  useEffect(() => {
    const fromState = (location.state as any)?.orderId as string | undefined;

    if (fromState) {
      localStorage.setItem('lastOrderId', fromState);
      setOrderId(fromState);
    } else {
      const stored = localStorage.getItem('lastOrderId');
      if (stored) {
        setOrderId(stored);
      }
    }
  }, [location.state]);

  // Fetch order from backend
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setLoading(false);
        setNotFound(true);
        return;
      }

      try {
        setLoading(true);
        const { data } = await api.get(`/api/orders/${orderId}`);
        setOrder(data);
        setNotFound(false);
      } catch (err: any) {
        console.error('Failed to load order', err);
        setNotFound(true);
        toast.error(
          err?.response?.data?.message || 'Could not load your order details.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
        Loading your order...
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <p className="text-xl font-semibold mb-4">Order Not Found</p>
        <Button onClick={() => navigate('/')} className="flex items-center gap-2">
          <Home className="w-4 h-4" />
          Go Home
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-3xl"
      >
        <Card className="shadow-md border border-border/20">
          <CardHeader className="flex flex-col items-center text-center space-y-3">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
            <CardTitle className="text-2xl font-bold">
              Order Placed Successfully!
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Order ID:&nbsp;
              <span className="font-mono">
                #{order._id.toString().slice(-8)}
              </span>
              &nbsp; • Placed on{' '}
              {new Date(order.createdAt).toLocaleString()}
            </p>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Order items */}
            <div>
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Items
              </h3>
              <div className="space-y-2">
                {order.orderItems.map((item) => (
                  <div
                    key={item._id || (item as any).product}
                    className="flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={getOrderItemImageUrl(item)}
                        alt={item.name}
                        className="w-10 h-10 rounded object-cover border border-border/20"
                      />
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-muted-foreground">
                          Qty: {item.qty}
                        </div>
                      </div>
                    </div>
                    <div className="font-semibold">
                      ₹{(item.price * item.qty).toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping & summary */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold mb-2">Shipping Address</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-line">
                  {order.shippingAddress.addressLine1}
                  {'\n'}
                  {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                  {order.shippingAddress.pincode}
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Payment</h3>
                <p className="text-sm text-muted-foreground">
                  Method: {order.paymentMethod}
                  <br />
                  Total Paid:{' '}
                  <span className="font-semibold text-foreground">
                    ₹{order.totalPrice.toFixed(2)}
                  </span>
                </p>
              </div>
            </div>

            <div className="pt-4 flex flex-wrap gap-3 justify-between">
              <Button
                variant="outline"
                onClick={() => navigate('/dashboard/orders')}
              >
                View Order History
              </Button>
              <Button onClick={() => navigate('/products')}>
                Continue Shopping
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default OrderSuccess;
