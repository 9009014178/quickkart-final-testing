import api from './api'; // Axios instance

// ================== Data Types ==================

export interface User {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'customer' | 'admin' | 'delivery_partner';
  // ✅ FIX: Add the isAdmin property for convenience in components
  isAdmin: boolean; 
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  name: string;
  email: string;
  password: string;
  role: string;
  phone?: string;
}

// Matches your backend login/register response:
// { _id, name, email, role, token }
export interface AuthResponse {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'admin' | 'delivery_partner';
  token: string;
}

export interface ResetPasswordData {
  email: string;
  otp: string;
  password: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

// Some reset password responses return token + status/message
export interface ResetPasswordResponse {
  token?: string;
  status?: string;
  message?: string;
}

// ================== Helper: Process User Data ==================

// Helper function to add the isAdmin flag before saving/setting user state
const processUserData = (userData: Omit<User, 'isAdmin'>): User => {
    // Determine isAdmin based on the role received from the backend
    const isAdmin = userData.role === 'admin';
    return {
        ...userData,
        isAdmin,
    };
};


// ================== Helper: handle token ==================

// Save token & set Authorization header on axios instance
const applyAuthToken = (token: string | undefined) => {
  if (!token) return;
  localStorage.setItem('token', token);
  api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
};

// Call this once on app start (e.g. in AuthContext) to rehydrate token
export const initAuthFromStorage = () => {
  const token = localStorage.getItem('token');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// ================== API Functions ==================

export const authService = {
  /** @desc Logs in a user */
  async login(credentials: LoginCredentials): Promise<User & { token: string }> {
    const { data } = await api.post<AuthResponse>('/api/auth/login', credentials);

    // Store token and set header for subsequent requests
    applyAuthToken(data.token);
    
    // ✅ Apply processUserData to add the isAdmin flag
    const processedUser = processUserData(data);

    return { ...processedUser, token: data.token };
  },

  /** @desc Registers a new user */
  async signup(data: SignupData): Promise<User & { token: string }> {
    const res = await api.post<AuthResponse>('/api/auth/register', data);

    // Store token and set header
    applyAuthToken(res.data.token);
    
    // ✅ Apply processUserData to add the isAdmin flag
    const processedUser = processUserData(res.data);

    return { ...processedUser, token: res.data.token };
  },

  /** @desc Logs out a user (informs backend + clears local token) */
  async logout(): Promise<void> {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout API call failed, but logging out anyway.', error);
    } finally {
      // Clear token locally
      localStorage.removeItem('token');
      delete api.defaults.headers.common['Authorization'];
    }
  },

  /** @desc Requests a password reset OTP */
  async forgotPassword(email: string): Promise<void> {
    await api.post('/api/auth/forgotpassword', { email });
  },

  /** @desc Resets password using OTP (and logs user in via new token if returned) */
  async resetPassword(data: ResetPasswordData): Promise<ResetPasswordResponse> {
    const res = await api.post<ResetPasswordResponse>('/api/auth/resetpassword', data);

    // Some backends return a new token on password reset
    if (res.data.token) {
      applyAuthToken(res.data.token);
    }

    return res.data;
  },

  /** @desc Gets the profile of the currently logged-in user */
  async getCurrentUser(): Promise<User> {
    const { data } = await api.get<User>('/api/users/profile');
    // ✅ Process data received from backend to ensure isAdmin flag is present
    return processUserData(data);
  },

  /** @desc Updates the profile (name, phone) of the currently logged-in user */
  async updateProfile(
    data: Partial<Pick<User, 'name' | 'phone'>>
  ): Promise<User> {
    const res = await api.put<User>('/api/users/profile', data);
    // ✅ Process data received from backend to ensure isAdmin flag is present
    return processUserData(res.data);
  },

  /**
   * @desc Changes the user's password
   * @route PUT /api/users/profile/password
   */
  async changePassword(
    passwords: ChangePasswordData
  ): Promise<{ message: string }> {
    const { data } = await api.put<{ message: string }>(
      '/api/users/profile/password',
      passwords
    );
    return data;
  },
};