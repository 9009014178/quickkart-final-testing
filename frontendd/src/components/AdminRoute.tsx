import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const AdminRoute: React.FC = () => {
  const { user, loading, isAuthenticated } = useAuth();
  const location = useLocation();

  // 1) While checking auth, show a visible loading screen
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground text-lg">
          Checking admin access…
        </p>
      </div>
    );
  }

  // 2) If not logged in or no user or not admin → go to login
  if (!isAuthenticated || !user || user.role !== "admin") {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3) Authenticated admin → render nested admin routes
  return <Outlet />;
};

export default AdminRoute;
