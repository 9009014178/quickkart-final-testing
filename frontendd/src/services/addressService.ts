import api from './api';

// ================== Data Types ==================

// Matches the addressSchema in your backend userModel
export interface Address {
  _id: string; // Backend uses _id
  addressLine1: string;
  addressLine2?: string;
  city: string;
  pincode: string; // Matches backend
  state: string; // Matches backend
  isDefault: boolean;
}

// Data needed to create a new address
export interface NewAddressData {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  pincode: string;
  state: string;
  isDefault?: boolean;
}

// ================== API Functions ==================

export const addressService = {
  /**
   * @desc Get all saved addresses for the logged-in user
   * @route GET /api/users/addresses
   */
  async getAddresses(): Promise<Address[]> {
    // Corrected path
    const { data } = await api.get('/api/users/addresses');
    return data;
  },

  /**
   * @desc Add a new address for the logged-in user
   * @route POST /api/users/addresses
   */
  async addAddress(addressData: NewAddressData): Promise<Address[]> {
    // Corrected path, backend returns the updated list
    const { data } = await api.post('/api/users/addresses', addressData);
    return data;
  },

  /**
   * @desc Update an existing address for the logged-in user
   * @route PUT /api/users/addresses/:id
   */
  async updateAddress(id: string, addressData: Partial<NewAddressData>): Promise<Address[]> {
    // Corrected path, backend returns the updated list
    const { data } = await api.put(`/api/users/addresses/${id}`, addressData);
    return data;
  },

  /**
   * @desc Delete an address by its ID
   * @route DELETE /api/users/addresses/:id
   */
  async deleteAddress(addressId: string): Promise<Address[]> {
    // Corrected path, backend returns the updated list
    const { data } = await api.delete(`/api/users/addresses/${addressId}`);
    return data;
  },

  // Removed getAddressById, setDefaultAddress, verifyPincode as they
  // don't have corresponding backend routes in our current setup.
};