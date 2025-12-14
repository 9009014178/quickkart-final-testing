import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import toast from 'react-hot-toast';

const EditProfilePage: React.FC = () => {
  const { user, updateProfile, loading: authLoading } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        role: user.role || 'customer',
        password: '',
        confirmPassword: '',
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required.');
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const updateData: any = { name: formData.name.trim(), phone: formData.phone.trim(), role: formData.role };
      if (formData.password) updateData.password = formData.password;

      await updateProfile(updateData);
      toast.success('Profile updated successfully.');
      // Reset password fields after successful update
      setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
    } catch (error) {
      console.error('Profile update failed:', error);
      toast.error('Failed to update profile.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return <div className="text-center py-8 text-muted-foreground">Loading profile...</div>;
  }

  return (
    <Card className="max-w-md mx-auto mt-8 shadow-lg border">
      <CardHeader>
        <CardTitle>Edit Profile</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">

          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter your full name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              readOnly
              disabled
              className="bg-muted text-muted-foreground"
            />
            <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Enter your phone number"
            />
          </div>

          {/* <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="customer">Customer</option>
              <option value="admin">Admin</option>
            </select>
          </div> */}

          {/* Buttons: Save Changes + Back */}
          <div className="flex flex-col sm:flex-row sm:justify-between gap-3 mt-4">
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="w-full sm:w-auto"
            >
              {isLoading ? 'Saving...' : 'Save Changes'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()} // Plain React back
              className="w-full sm:w-auto"
            >
              Back
            </Button>
          </div>

        </form>
      </CardContent>
    </Card>
  );
};

export default EditProfilePage;