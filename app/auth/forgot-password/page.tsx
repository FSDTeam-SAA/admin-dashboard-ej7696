"use client";

import React from "react";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { authAPI } from "@/lib/api";
import { toast } from "sonner";
import { Mail, ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await authAPI.forgotPassword({ email });
      setIsSubmitted(true);
      toast.success("OTP sent to your email");
    } catch (error: any) {
      console.error("[v0] Forgot password error:", error);
      toast.error(error.response?.data?.message || "Failed to send OTP");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <div className="p-8">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Image src="/logo.png" alt="Logo" width={100} height={100} />
            </div>

            <h1 className="text-2xl font-bold text-center mb-2">
              Check Your Email
            </h1>
            <p className="text-center text-gray-600 text-sm mb-8">
              We've sent a password reset link to {email}
            </p>

            <Button
              onClick={() => router.push("/auth/verify-otp")}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full"
            >
              Enter OTP
            </Button>

            <div className="mt-4 text-center">
              <Link
                href="/auth/login"
                className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image src="/logo.png" alt="Logo" width={100} height={100} />
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">
            Forgot Password
          </h1>
          <p className="text-center text-gray-600 text-sm mb-8">
            Enter your registered email address. We'll send you a code to reset
            your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send OTP"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link
              href="/auth/login"
              className="text-sm text-blue-600 hover:text-blue-700 inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </Card>
    </div>
  );
}
