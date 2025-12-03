import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import api from '@/services/api'; // 👈 make sure this path is correct

interface OrderItem {
  name: string;
  qty: number;
}

interface Order {
  _id: string;
  createdAt: string;
  totalPrice: number;
  isPaid: boolean;
  isDelivered: boolean;
  orderItems: OrderItem[];
}

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const normalizeOrder = (raw: any): Order => {
    const items = raw.orderItems || raw.items || [];

    return {
      _id: raw._id,
      createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
      totalPrice:
        typeof raw.totalPrice === 'number'
          ? raw.totalPrice
          : typeof raw.totalAmount === 'number'
          ? raw.totalAmount
          : typeof raw.subtotal === 'number'
          ? raw.subtotal
          : 0,
      isPaid:
        typeof raw.isPaid === 'boolean'
          ? raw.isPaid
          : raw.paymentStatus === 'paid',
      isDelivered:
        typeof raw.isDelivered === 'boolean'
          ? raw.isDelivered
          : raw.orderStatus === 'delivered',
      orderItems: items.map((it: any) => ({
        name: it.name || it.product?.name || 'Item',
        qty: it.qty ?? it.quantity ?? 1,
      })),
    };
  };

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        // axios instance automatically sends Authorization header
        const res = await api.get('/api/orders/myorders');

        console.log('🔍 /api/orders/myorders response:', res.data);

        const data = res.data;

        // Handle different possible shapes:
        const rawOrders = Array.isArray(data)
          ? data
          : Array.isArray(data.orders)
          ? data.orders
          : Array.isArray(data.data)
          ? data.data
          : Array.isArray(data.userOrders)
          ? data.userOrders
          : [];

        if (!Array.isArray(rawOrders)) {
          console.warn('Expected an array of orders but got:', rawOrders);
        }

        const normalized: Order[] = rawOrders.map(normalizeOrder);
        setOrders(normalized);
      } catch (error: any) {
        console.error('Error fetching orders:', error);
        const status = error?.response?.status;
        if (status === 401) {
          toast.error('Unauthorized. Please login again.');
        } else {
          toast.error('Failed to fetch order history.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return (
    <Card className="max-w-5xl mx-auto mt-6">
      <CardHeader>
        <CardTitle>Order History</CardTitle>
        <CardDescription>View your past orders.</CardDescription>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="text-center py-6 text-muted-foreground">
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <p className="text-center text-muted-foreground py-6">
            You haven&apos;t placed any orders yet.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell
                    className="font-medium truncate"
                    title={order._id}
                  >
                    {order._id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>₹{order.totalPrice.toFixed(2)}</TableCell>
                  <TableCell>
                    {order.isDelivered
                      ? 'Delivered'
                      : order.isPaid
                      ? 'Processing'
                      : 'Pending Payment'}
                  </TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        toast('View details not implemented yet.');
                      }}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default OrderHistoryPage;
