import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const DashboardPage: React.FC = () => {
  const { user, logout, loading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center"> 
        <p className="text-muted-foreground">Loading your account…</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-semibold">You’re not logged in</h1>
        <p className="text-muted-foreground">
          Please sign in to access your dashboard.
        </p>
        <div className="flex gap-3">
          {/* Fix for React.Children.only error: single line for asChild buttons */}
          <Button asChild><Link to="/login">Go to Login</Link></Button>
          <Button variant="outline" asChild><Link to="/">Back to Home</Link></Button>
        </div>
      </div>
    );
  }

  // ✅ FIX: Redirect Admin users immediately
  if (user.isAdmin) {
    navigate("/admin", { replace: true });
    return null; // Return null while redirecting
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">My Account</h1>

      {/* Button styles updated to match Admin Dashboard UI/UX */}
      <div className="flex flex-wrap gap-4 mb-8 border-b pb-4">
        
        {/* Default Buttons for navigation (No variant needed) */}
        <Button asChild><Link to="/dashboard/profile">Edit Profile</Link></Button>
        <Button asChild><Link to="/dashboard/orders">Order History</Link></Button>
        <Button asChild><Link to="/dashboard/addresses">Manage Addresses</Link></Button>
        <Button asChild><Link to="/dashboard/change-password">Change Password</Link></Button>
        
        <Button
          variant="destructive" // Destructive variant for clear Logout action
          onClick={handleLogout}
          className="ml-auto md:ml-0" // Positioning
        >
          Logout
        </Button>
      </div>

      <Outlet />
    </div>
  );
};

export default DashboardPage;