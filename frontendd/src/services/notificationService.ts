import api from './api';

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  newsletter: boolean;
}

export interface Notification {
  id: string;
  type: 'order_update' | 'promotion' | 'system';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  data?: any;
}

export const notificationService = {
  async getNotifications(page: number = 1, limit: number = 20): Promise<{ notifications: Notification[]; total: number; unreadCount: number }> {
    const response = await api.get('/notifications', { params: { page, limit } });
    return response.data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await api.put(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await api.put('/notifications/read-all');
  },

  async getPreferences(): Promise<NotificationPreferences> {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  async updatePreferences(preferences: NotificationPreferences): Promise<NotificationPreferences> {
    const response = await api.put('/notifications/preferences', preferences);
    return response.data;
  },

  async subscribeToWebPush(subscription: PushSubscription): Promise<void> {
    await api.post('/notifications/subscribe-push', subscription);
  },
};
