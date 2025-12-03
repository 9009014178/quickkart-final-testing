import api from './api';

// ================== TYPES ==================

export interface PaymentMethod {
  id: string;
  type: 'upi' | 'card' | 'cod';
  details: any;
  isDefault: boolean;
}

export interface PromoCode {
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  minOrderValue: number;
  maxDiscount?: number;
  validUntil: string;
}

// ================== SERVICE ==================

export const paymentService = {
  /** Initiate payment for an order */
  async initiatePayment(orderId: string, method: 'upi' | 'card'): Promise<{ paymentUrl?: string; paymentId: string } | null> {
    try {
      const response = await api.post('/payment/initiate', { orderId, method });
      return response.data;
    } catch (error: any) {
      console.error('Failed to initiate payment:', error.response?.data?.message || error.message);
      return null;
    }
  },

  /** Verify payment after completion */
  async verifyPayment(paymentId: string, orderId: string): Promise<{ success: boolean } | null> {
    try {
      const response = await api.post('/payment/verify', { paymentId, orderId });
      return response.data;
    } catch (error: any) {
      console.error('Failed to verify payment:', error.response?.data?.message || error.message);
      return null;
    }
  },

  /** Validate promo code for a given order value */
  async validatePromoCode(code: string, orderValue: number): Promise<PromoCode | null> {
    try {
      const response = await api.post('/payment/validate-promo', { code, orderValue });
      return response.data;
    } catch (error: any) {
      console.error(`Promo code ${code} validation failed:`, error.response?.data?.message || error.message);
      return null;
    }
  },

  /** Get all saved payment methods for the user */
  async getSavedPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const response = await api.get('/payment/methods');
      return response.data || [];
    } catch (error: any) {
      console.error('Failed to fetch payment methods:', error.response?.data?.message || error.message);
      return [];
    }
  },

  /** Add a new payment method */
  async addPaymentMethod(method: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod | null> {
    try {
      const response = await api.post('/payment/methods', method);
      return response.data;
    } catch (error: any) {
      console.error('Failed to add payment method:', error.response?.data?.message || error.message);
      return null;
    }
  },

  /** Delete a saved payment method */
  async deletePaymentMethod(id: string): Promise<boolean> {
    try {
      await api.delete(`/payment/methods/${id}`);
      return true;
    } catch (error: any) {
      console.error(`Failed to delete payment method ${id}:`, error.response?.data?.message || error.message);
      return false;
    }
  },
};