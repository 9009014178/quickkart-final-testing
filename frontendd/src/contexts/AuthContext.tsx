import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';
import { authService, User } from '@/services/authService';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (name: string, email: string, password: string, role: string) => Promise<User>;
  logout: () => void;
  isAuthenticated: boolean;
  updateProfile: (data: Partial<Pick<User, 'name' | 'phone'>>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const getErrorMessage = (error: unknown) => {
    if (!error) return "Something went wrong";
    if (typeof error === "string") return error;
    if (error instanceof Error) return error.message;
    if ((error as any)?.response?.data?.message) return (error as any).response.data.message;
    return "Something went wrong";
  };

  // Validate token on mount
  useEffect(() => {
    const validate = async () => {
      const token = localStorage.getItem("token");
      if (!token) return setLoading(false);

      try {
        const userData = await authService.getCurrentUser();
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
      } catch (err) {
        console.error("Token validation failed:", getErrorMessage(err));
        logout();
      } finally {
        setLoading(false);
      }
    };

    validate();
  }, []);

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await authService.login({ email, password });
      const { token, ...userData } = response;

      setUser(userData as User);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      toast.success("Successfully logged in!");
      return userData as User;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const signup = async (name: string, email: string, password: string, role: string): Promise<User> => {
    try {
      const response = await authService.signup({ name, email, password, role });
      const { token, ...userData } = response;

      setUser(userData as User);
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(userData));

      toast.success("Account created successfully!");
      return userData as User;
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  const logout = () => {
    authService.logout().catch(err => console.error("Logout failed:", getErrorMessage(err)));
    setUser(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.success("Logged out successfully");
  };

  const updateProfile = async (data: Partial<Pick<User, "name" | "phone">>) => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      toast.success("Profile updated successfully");
    } catch (err) {
      toast.error(getErrorMessage(err));
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      logout,
      isAuthenticated: !!user,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};