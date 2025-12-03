import api from './api';

export interface Location {
  latitude: number;
  longitude: number;
}

export interface ServiceArea {
  pincode: string;
  city: string;
  area: string;
  serviceable: boolean;
  deliveryTime: string;
}

export const locationService = {
  async detectLocation(): Promise<Location> {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        reject(new Error('Geolocation not supported'));
      }
    });
  },

  async checkServiceability(pincode: string): Promise<ServiceArea> {
    const response = await api.get('/location/check-serviceability', {
      params: { pincode },
    });
    return response.data;
  },

  async getNearbyStores(latitude: number, longitude: number): Promise<any[]> {
    const response = await api.get('/location/nearby-stores', {
      params: { latitude, longitude },
    });
    return response.data;
  },

  async getDeliveryEstimate(pincode: string): Promise<string> {
    const response = await api.get('/location/delivery-estimate', {
      params: { pincode },
    });
    return response.data.estimatedTime;
  },
};
