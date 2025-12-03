import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import { authService } from "@/services/authService";
import BackButton from "@/components/BackButton";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email);

      toast.success("Password reset OTP sent to your email.");

      // Redirect to reset-password page with email
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error: any) {
      console.error("Forgot Password error:", error);
      toast.error(error?.message || "Failed to send OTP. Please check the email.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-10 px-4">
      <Card className="max-w-md w-full shadow-lg">
        <CardHeader className="text-center relative">
          <BackButton className="absolute left-4 top-4" />
          <CardTitle className="text-2xl font-bold pt-8">Forgot Password?</CardTitle>
          <CardDescription>
            Enter your email below and we will send you an OTP to reset your password.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5 pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  className="pl-10"
                />
              </div>
            </div>

            {/* Submit */}
            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Sending OTP..." : "Send Reset OTP"}
            </Button>

            {/* Link */}
            <div className="text-center text-sm">
              Remembered your password?{" "}
              <Link to="/login" className="text-brand-primary hover:underline">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPasswordPage;