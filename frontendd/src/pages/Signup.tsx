import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, User, UserCheck, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'customer', // Default role
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signup } = useAuth(); // signup now returns Promise<User>
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // 1. Await the signup and get the registered user's data
      const signedUpUser = await signup(formData.name, formData.email, formData.password, formData.role);

      // 2. Check the actual role from the response and redirect
      if (signedUpUser.role === 'admin') {
        navigate('/admin/dashboard'); // Admin goes to admin dashboard
      } else {
        navigate('/'); // Customer goes to the main homepage (Home.tsx)
      }

    } catch (error) {
      // Error toast is handled within the signup function in AuthContext
      console.error("Signup process failed:", error); // Keep console log for debugging
    } finally {
      setIsLoading(false);
    }
  };

  // Handles changes for both input and select elements
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user types in a field
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8"
      >
        {/* Header */}
        <div className="text-center">
          <Link to="/" className="inline-flex items-center space-x-2 mb-8">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">Q</span>
            </div>
            <span className="text-xl sm:text-2xl font-bold gradient-text">Quick-Kart</span>
          </Link>
          <h2 className="text-2xl sm:text-3xl font-bold text-foreground mb-2"> Create your account </h2>
          <p className="text-muted-foreground"> Join thousands of happy customers today </p>
        </div>

        {/* Signup Form */}
        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-card rounded-2xl p-6 sm:p-8 space-y-6"
        >
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2"> Full Name </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                <Input id="name" name="name" type="text" required placeholder="Enter your full name" value={formData.name} onChange={handleChange} className={`pl-10 input-field ${errors.name ? 'border-destructive' : ''}`} autoComplete="name"/>
                {errors.name && (<p className="mt-1 text-xs text-destructive">{errors.name}</p>)}
              </div>
            </div>
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2"> Email Address </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                <Input id="email" name="email" type="email" required placeholder="Enter your email" value={formData.email} onChange={handleChange} className={`pl-10 input-field ${errors.email ? 'border-destructive' : ''}`} autoComplete="email"/>
                {errors.email && (<p className="mt-1 text-xs text-destructive">{errors.email}</p>)}
              </div>
            </div>
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2"> Password </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                <Input id="password" name="password" type={showPassword ? 'text' : 'password'} required placeholder="Create a password (min. 6 chars)" value={formData.password} onChange={handleChange} className={`pl-10 pr-10 input-field ${errors.password ? 'border-destructive' : ''}`} autoComplete="new-password"/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none" aria-label={showPassword ? "Hide password" : "Show password"}> {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />} </button>
                {errors.password && (<p className="mt-1 text-xs text-destructive">{errors.password}</p>)}
              </div>
            </div>
            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-foreground mb-2"> Confirm Password </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                <Input id="confirmPassword" name="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} required placeholder="Confirm your password" value={formData.confirmPassword} onChange={handleChange} className={`pl-10 pr-10 input-field ${errors.confirmPassword ? 'border-destructive' : ''}`} autoComplete="new-password"/>
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none" aria-label={showConfirmPassword ? "Hide password" : "Show password"}> {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />} </button>
                {errors.confirmPassword && (<p className="mt-1 text-xs text-destructive">{errors.confirmPassword}</p>)}
              </div>
            </div>
            {/* Role Selector */}
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-foreground mb-2"> Register as </label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                <select id="role" name="role" value={formData.role} onChange={handleChange} className="pl-10 pr-10 input-field w-full appearance-none bg-input border border-border rounded-md px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start space-x-2">
            <input id="terms" type="checkbox" required className="mt-1 w-4 h-4 text-brand-primary bg-input border-border rounded focus:ring-brand-primary focus:ring-offset-0 focus:ring-2 cursor-pointer"/>
            <label htmlFor="terms" className="text-sm text-muted-foreground cursor-pointer"> I agree to the{' '} <Link to="/terms" className="text-brand-primary hover:underline"> Terms of Service </Link> and <Link to="/privacy" className="text-brand-primary hover:underline"> Privacy Policy </Link> </label>
          </div>

          {/* Submit Button */}
          <Button type="submit" disabled={isLoading} className="btn-hero w-full">
            {isLoading ? ( <div className="flex items-center justify-center space-x-2"> <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin"></div> <span>Creating account...</span> </div> ) : ( 'Create Account' )}
          </Button>

          {/* Login Link */}
          <div className="text-center text-sm text-muted-foreground"> Already have an account?{' '} <Link to="/login" className="text-brand-primary hover:text-brand-secondary font-medium hover:underline transition-colors"> Sign in here </Link> </div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default Signup;