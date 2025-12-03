import api from './api';

export interface Address {
  id?: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  latitude?: number;
  longitude?: number;
  isDefault?: boolean;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface TrackingDetails {
  currentStatus: string;
  timeline: {
    status: string;
    timestamp: string;
    message: string;
  }[];
  deliveryPartner?: {
    name: string;
    phone: string;
    location?: {
      latitude: number;
      longitude: number;
    };
  };
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  deliveryFee: number;
  status: 'placed' | 'confirmed' | 'packed' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: 'upi' | 'card' | 'cod';
  paymentStatus: 'pending' | 'completed' | 'failed';
  shippingAddress: Address;
  estimatedDeliveryTime: string;
  deliveryPartnerId?: string;
  trackingDetails?: TrackingDetails;
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  items: OrderItem[];
  shippingAddressId: string;
  paymentMethod: 'upi' | 'card' | 'cod';
  promoCode?: string;
}

export const orderService = {
  async createOrder(data: CreateOrderData): Promise<Order | null> {
    try {
      const response = await api.post('/orders', data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to create order:', error.response?.data?.message || error.message);
      return null;
    }
  },

  async getOrders(page: number = 1, limit: number = 10): Promise<{ orders: Order[]; total: number }> {
    try {
      const response = await api.get('/orders', { params: { page, limit } });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch orders:', error.response?.data?.message || error.message);
      return { orders: [], total: 0 };
    }
  },

  async getOrderById(orderId: string): Promise<Order | null> {
    try {
      const response = await api.get(`/orders/${orderId}`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to fetch order ${orderId}:`, error.response?.data?.message || error.message);
      return null;
    }
  },

  async trackOrder(orderId: string): Promise<TrackingDetails | null> {
    try {
      const response = await api.get(`/orders/${orderId}/track`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to track order ${orderId}:`, error.response?.data?.message || error.message);
      return null;
    }
  },

  async cancelOrder(orderId: string, reason?: string): Promise<Order | null> {
    try {
      const response = await api.post(`/orders/${orderId}/cancel`, { reason });
      return response.data;
    } catch (error: any) {
      console.error(`Failed to cancel order ${orderId}:`, error.response?.data?.message || error.message);
      return null;
    }
  },

  async rateOrder(orderId: string, rating: number, review?: string): Promise<boolean> {
    try {
      await api.post(`/orders/${orderId}/rate`, { rating, review });
      return true;
    } catch (error: any) {
      console.error(`Failed to rate order ${orderId}:`, error.response?.data?.message || error.message);
      return false;
    }
  },

  async reorder(orderId: string): Promise<Order | null> {
    try {
      const response = await api.post(`/orders/${orderId}/reorder`);
      return response.data;
    } catch (error: any) {
      console.error(`Failed to reorder ${orderId}:`, error.response?.data?.message || error.message);
      return null;
    }
  },
};