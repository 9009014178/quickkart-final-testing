import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-4">Admin Dashboard</h1>

      <p className="text-muted-foreground mb-6">
        Welcome, {user?.name || user?.email || "Admin"}.
      </p>

      <div className="flex flex-wrap gap-4">
        <Button asChild>
          <Link to="/admin/products">Manage Products</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to="/">Back to Store</Link>
        </Button>
      </div>
    </div>
  );
};

export default AdminDashboard;
