// AdminDashboard.tsx
import React from "react";
import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";

const AdminDashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/", { replace: true });
  };

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      <p className="text-muted-foreground mb-6">
        Welcome, {user?.name || user?.email || "Admin"}.
      </p>

      <div className="flex flex-wrap gap-4 mb-8 border-b pb-4">
        <Button asChild>
          <Link to="/admin/products">Manage Products</Link>
        </Button>
        <Button asChild>
          <Link to="/admin/profile">Edit Profile</Link>
        </Button>
        <Button asChild>
          <Link to="/admin/change-password">Change Password</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Back to Store</Link>
        </Button>
        <Button
          variant="destructive"
          onClick={handleLogout}
          className="ml-auto md:ml-0"
        >
          Logout
        </Button>
      </div>

      {/* Nested routes will render here */}
      <Outlet />
    </div>
  );
};

export default AdminDashboard;