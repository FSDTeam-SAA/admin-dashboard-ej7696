"use client";

import React from "react";

import { useState, useRef, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { authAPI } from "@/lib/api";
import { toast } from "sonner";
import { ArrowLeft, Loader2 } from "lucide-react";
import Image from "next/image";

function VerifyOTPContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [isLoading, setIsLoading] = useState(false);
  const [timer, setTimer] = useState(300); // 5 minutes
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (timer <= 0) return;
    const interval = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleOtpChange = (index: number, value: string) => {
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const otpValue = otp.join("");

    if (otpValue.length !== 6) {
      toast.error("Please enter all 6 digits");
      return;
    }

    setIsLoading(true);

    try {
      await authAPI.verifyEmail({ token: otpValue });
      toast.success("OTP verified! Proceeding to reset password");
      router.push(`/auth/reset-password?token=${otpValue}`);
    } catch (error: any) {
      console.error("[v0] Verify OTP error:", error);
      toast.error(error.response?.data?.message || "Invalid OTP");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await authAPI.forgotPassword({ email: searchParams.get("email") || "" });
      setTimer(300);
      setOtp(["", "", "", "", "", ""]);
      toast.success("OTP resent to your email");
    } catch (error: any) {
      console.error("[v0] Resend OTP error:", error);
      toast.error("Failed to resend OTP");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <div className="p-8">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <Image src="/logo.png" alt="Logo" width={100} height={100} />
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">Enter OTP</h1>
          <p className="text-center text-gray-600 text-sm mb-8">
            We've sent a 6-digit code to your email
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* OTP Input Fields */}
            <div className="flex gap-3 justify-center">
              {otp.map((digit, index) => (
                <Input
                  key={index}
                  ref={(el) => {
                    inputRefs.current[index] = el;
                  }}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-14 h-14 text-center text-xl font-semibold rounded-lg border-2 border-gray-200 focus:border-blue-600 focus:outline-none"
                  disabled={isLoading}
                  inputMode="numeric"
                />
              ))}
            </div>

            {/* Timer */}
            <div className="text-center">
              {timer > 0 ? (
                <p className="text-sm text-gray-600">
                  OTP expires in{" "}
                  <span className="font-semibold text-blue-600">
                    {Math.floor(timer / 60)}:
                    {(timer % 60).toString().padStart(2, "0")}
                  </span>
                </p>
              ) : (
                <p className="text-sm text-red-600">OTP has expired</p>
              )}
            </div>

            {/* Verify Button */}
            <Button
              type="submit"
              disabled={isLoading || timer <= 0}
              className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-full disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                "Verify"
              )}
            </Button>
          </form>

          {/* Resend OTP */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Didn't receive OTP?{" "}
              <button
                onClick={handleResendOtp}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-700 font-semibold disabled:opacity-50"
              >
                RESEND OTP
              </button>
            </p>
          </div>

          {/* Back to Login */}
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

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={null}>
      <VerifyOTPContent />
    </Suspense>
  );
}
