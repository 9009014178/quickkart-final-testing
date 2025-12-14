import { Suspense, lazy } from "react";
import { Toaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";
import { LocationProvider } from "@/contexts/LocationContext";
import Navbar from "@/components/Navbar";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminRoute from "@/components/AdminRoute";
import Spinner from "@/components/Spinner";

// Public pages
const Home = lazy(() => import("@/pages/Home"));
const Products = lazy(() => import("@/pages/Products"));
const ProductDetail = lazy(() => import("@/pages/ProductDetail"));
const Cart = lazy(() => import("@/pages/Cart"));
const Login = lazy(() => import("@/pages/Login"));
const Signup = lazy(() => import("@/pages/Signup"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const OrderSuccess = lazy(() => import("@/pages/OrderSuccess"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Admin pages
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const ManageProducts = lazy(() => import("@/pages/admin/ManageProducts"));
const ProductForm = lazy(() => import("@/pages/admin/ProductForm"));

// Customer dashboard pages
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const EditProfilePage = lazy(() => import("@/pages/dashboard/EditProfilePage"));
const OrderHistoryPage = lazy(() => import("@/pages/dashboard/OrderHistoryPage"));
const ManageAddressesPage = lazy(() => import("@/pages/dashboard/ManageAddressesPage"));
const ChangePasswordPage = lazy(() => import("@/pages/dashboard/ChangePasswordPage"));

// Forgot / Reset
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <AuthProvider>
        <LocationProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster
                position="top-right"
                toastOptions={{
                  style: {
                    background: "hsl(var(--card))",
                    color: "hsl(var(--card-foreground))",
                    border: "1px solid hsl(var(--border))",
                  },
                }}
              />

              <BrowserRouter>
                <div className="min-h-screen bg-background">
                  <Navbar />
                  <main className="pt-16">
                    <Suspense
                      fallback={
                        <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
                          <Spinner />
                        </div>
                      }
                    >
                      <Routes>
                        {/* === Public Routes === */}
                        <Route path="/" element={<Home />} />
                        <Route path="/products" element={<Products />} />
                        <Route path="/product/:id" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                        <Route path="/reset-password" element={<ResetPasswordPage />} />
                        <Route path="/order-success" element={<OrderSuccess />} />
                        <Route path="/about" element={<About />} />
                        <Route path="/contact" element={<Contact />} />

                        {/* === Protected Customer Routes === */}
                        <Route element={<ProtectedRoute />}>
                          <Route path="/dashboard" element={<DashboardPage />}>
                            <Route index element={<EditProfilePage />} />
                            <Route path="profile" element={<EditProfilePage />} />
                            <Route path="orders" element={<OrderHistoryPage />} />
                            <Route path="addresses" element={<ManageAddressesPage />} />
                            <Route path="change-password" element={<ChangePasswordPage />} />
                          </Route>
                          <Route path="/checkout" element={<Checkout />} />
                        </Route>

                        {/* === Admin Only Routes === */}
                        <Route element={<AdminRoute />}>
                          {/* Admin Dashboard */}
                          <Route path="/admin" element={<AdminDashboard />} />
                          <Route path="/admin/dashboard" element={<AdminDashboard />} />

                          {/* Admin Products */}
                          <Route path="/admin/products" element={<ManageProducts />} />
                          <Route path="/admin/products/new" element={<ProductForm />} />
                          <Route path="/admin/products/edit/:id" element={<ProductForm />} />

                          {/* Admin Profile & Change Password */}
                          <Route path="/admin/profile" element={<EditProfilePage />} />
                          <Route path="/admin/change-password" element={<ChangePasswordPage />} />
                        </Route>

                        {/* === Not Found === */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </main>
                </div>
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </LocationProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;