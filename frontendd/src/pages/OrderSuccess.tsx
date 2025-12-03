import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, Package, Truck, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Order {
  id: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  total: number;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
}

const OrderSuccess = () => {
  const [order, setOrder] = useState<Order | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const orderData = localStorage.getItem('lastOrder');
    if (orderData) {
      setOrder(JSON.parse(orderData));
    }

    return () => {
      // Cleanup last order from localStorage
      localStorage.removeItem('lastOrder');
    };
  }, []);

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Order Not Found</h1>
          <Link to="/">
            <Button>Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const estimatedDelivery = new Date();
  estimatedDelivery.setMinutes(estimatedDelivery.getMinutes() + 8); // 8 minutes from now

  const orderSteps = [
    { icon: CheckCircle, label: 'Order Confirmed', completed: true },
    { icon: Package, label: 'Processing', completed: false },
    { icon: Truck, label: 'Shipped', completed: false },
    { icon: MapPin, label: 'Delivered', completed: false },
  ];

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="w-20 h-20 bg-brand-success rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle className="w-10 h-10 text-white" />
          </motion.div>
          
          <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Order Confirmed!
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            Thank you for your purchase. Your order has been received and is being processed.
          </p>
          <p className="text-brand-primary font-semibold">
            Order #{order.id}
          </p>
        </motion.div>

        {/* Order Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-foreground mb-6">Order Status</h2>
          
          <div className="flex items-center justify-between relative">
            {orderSteps.map((step, index) => (
              <React.Fragment key={step.label}>
                <div className="flex flex-col items-center flex-1 relative z-10">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                    step.completed ? 'bg-brand-success text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  <span className={`text-sm font-medium ${
                    step.completed ? 'text-brand-success' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < orderSteps.length - 1 && (
                  <div className={`absolute top-5 left-[calc(50%+24px)] w-[calc(100%-48px)] h-0.5 ${
                    orderSteps[index + 1].completed ? 'bg-brand-success' : 'bg-muted'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Order Details */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Order Items */}
            <div className="bg-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Order Items ({order.items.length})
              </h3>
              
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center space-x-4">
                    <div className="w-16 h-16 bg-muted rounded-lg overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground">{item.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-foreground">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Shipping Address
              </h3>
              
              <div className="text-muted-foreground">
                <p className="font-medium text-foreground">
                  {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                </p>
                <p>{order.shippingAddress.address}</p>
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Order Summary & Delivery Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-6"
          >
            {/* Delivery Information */}
            <div className="bg-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Delivery Information
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Order Date:</span>
                  <span className="font-medium text-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Estimated Delivery:</span>
                  <span className="font-medium text-brand-primary">
                    {estimatedDelivery.toLocaleTimeString()} (8 mins)
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery Method:</span>
                  <span className="font-medium text-foreground">
                    QuickKart Express (5-10 mins)
                  </span>
                </div>
              </div>
            </div>

            {/* Order Total */}
            <div className="bg-card rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Order Summary
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between text-lg font-bold text-foreground border-t border-border pt-3">
                  <span>Total Paid</span>
                  <span>₹{order.total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Link to="/products">
                <Button className="btn-hero w-full group">
                  Continue Shopping
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              
              <Button
                variant="outline"
                className="w-full"
                onClick={() => navigate('/track-order')}
              >
                Track Your Order
              </Button>
            </div>
          </motion.div>
        </div>

        {/* What's Next */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-12 bg-gradient-hero rounded-2xl p-8 text-center"
        >
          <h3 className="text-xl font-semibold text-foreground mb-4">
            What happens next?
          </h3>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-muted-foreground">
            <div>
              <Package className="w-8 h-8 text-brand-primary mx-auto mb-2" />
              <p className="font-medium text-foreground mb-1">Order Processing</p>
              <p>We're picking your items from our nearby dark store right now.</p>
            </div>
            <div>
              <Truck className="w-8 h-8 text-brand-primary mx-auto mb-2" />
              <p className="font-medium text-foreground mb-1">Out for Delivery</p>
              <p>Your order is on its way and will reach you in 5-10 minutes.</p>
            </div>
            <div>
              <MapPin className="w-8 h-8 text-brand-primary mx-auto mb-2" />
              <p className="font-medium text-foreground mb-1">Delivered</p>
              <p>Lightning-fast delivery right to your doorstep!</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderSuccess;