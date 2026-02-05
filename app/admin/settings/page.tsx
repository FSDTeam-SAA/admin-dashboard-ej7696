"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { paymentAPI, authAPI } from "@/lib/api"; // ✅ adjust if authAPI is in different file
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  Save,
  Loader2,
  DollarSign,
  ListChecks,
  Plus,
  X,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

// ✅ shadcn dialog (adjust path if needed)
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

type PricingFormData = {
  examUnlockPrice: string;
  professionalPlanPrice: string;
  professionalPlanIntervalCount: string;
  professionalPlanIntervalUnit: "days" | "weeks" | "months" | "years" | string;
  professionalPlanDescription: string;
  professionalPlanFeatures: string[];
};

type ChangePasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export default function SettingsPage() {
  const [formData, setFormData] = useState<PricingFormData>({
    examUnlockPrice: "150",
    professionalPlanPrice: "180",
    professionalPlanIntervalCount: "3",
    professionalPlanIntervalUnit: "months",
    professionalPlanDescription: "What's included in your plan",
    professionalPlanFeatures: [
      "Access to selected free exams",
      "Full-length mock exams",
      "Timed & full simulation modes",
      "Interactive study mode",
      "Progress tracking, performance dashboard & exam history",
      "Detailed explanations with code references",
      "All smart study tools",
    ],
  });

  const [featureInput, setFeatureInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ✅ Change password modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordForm>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // ✅ Eye toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Fetch Pricing Settings
  const { isLoading } = useQuery(
    "pricing-settings",
    paymentAPI.getPricingSettings,
    {
      onSuccess: (response: any) => {
        // API example: { success: true, message: "...", data: { ... } }
        const data = response?.data?.data;
        if (!data) return;

        setFormData((prev) => ({
          ...prev,
          examUnlockPrice: data.examUnlockPrice?.toString() ?? "150",
          professionalPlanPrice:
            data.professionalPlanPrice?.toString() ?? "180",
          professionalPlanIntervalCount:
            data.professionalPlanIntervalCount?.toString() ?? "3",
          professionalPlanIntervalUnit:
            data.professionalPlanIntervalUnit ?? "months",
          professionalPlanDescription:
            data.professionalPlanDescription ?? "What's included in your plan",
          professionalPlanFeatures: Array.isArray(data.professionalPlanFeatures)
            ? data.professionalPlanFeatures
            : prev.professionalPlanFeatures,
        }));
      },
      onError: (error: any) => {
        console.error("[Settings] Fetch error:", error);
        toast.error("Failed to load settings");
      },
    }
  );

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const normalizedFeatureInput = useMemo(
    () => featureInput.trim(),
    [featureInput]
  );

  const handleAddFeature = () => {
    const value = normalizedFeatureInput;
    if (!value) return;

    setFormData((prev) => {
      const exists = prev.professionalPlanFeatures.some(
        (f) => f.toLowerCase() === value.toLowerCase()
      );
      if (exists) {
        toast.warning("That feature already exists");
        return prev;
      }

      return {
        ...prev,
        professionalPlanFeatures: [...prev.professionalPlanFeatures, value],
      };
    });

    setFeatureInput("");
  };

  const handleRemoveFeature = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      professionalPlanFeatures: prev.professionalPlanFeatures.filter(
        (_, i) => i !== index
      ),
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      await paymentAPI.updatePricing({
        examUnlockPrice: parseFloat(formData.examUnlockPrice),
        professionalPlanPrice: parseFloat(formData.professionalPlanPrice),
        currency: "USD",
        professionalPlanIntervalCount: parseInt(
          formData.professionalPlanIntervalCount,
          10
        ),
        professionalPlanIntervalUnit: formData.professionalPlanIntervalUnit,
        professionalPlanDescription: formData.professionalPlanDescription,
        professionalPlanFeatures: formData.professionalPlanFeatures,
      });

      toast.success("Settings updated successfully");
    } catch (error: any) {
      console.error("[Settings] Save error:", error);
      toast.error("Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  // ✅ Password modal handlers
  const openPasswordModal = () => {
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setIsPasswordModalOpen(true);
  };

  const closePasswordModal = () => {
    if (isChangingPassword) return;
    setIsPasswordModalOpen(false);
    setPasswordForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast.error("Please fill all password fields");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New password and confirm password do not match");
      return;
    }

    setIsChangingPassword(true);
    try {
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });

      toast.success("Password changed successfully");
      closePasswordModal();
    } catch (error: any) {
      console.error("[Settings] Change password error:", error);
      toast.error(error?.response?.data?.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div className=" py-10 px-4 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Platform Settings
          </h1>
          <p className="text-gray-500 mt-2">
            Configure pricing, subscription intervals, and plan features.
          </p>
        </div>
        <div>
          <Button type="button" onClick={openPasswordModal} className="gap-2">
            <Lock className="h-4 w-4" />
            Change password
          </Button>
        </div>
      </div>

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* General Pricing */}
        <Card className="p-6 md:p-8 shadow-sm border-gray-200">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <DollarSign className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              General Pricing
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Exam Unlock Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Individual Exam Price (USD)
              </label>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input
                  type="number"
                  name="examUnlockPrice"
                  value={formData.examUnlockPrice}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  step="0.01"
                  min="0"
                />
              )}
            </div>

            {/* Professional Plan Price */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Pro Plan Price (USD)
              </label>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input
                  type="number"
                  name="professionalPlanPrice"
                  value={formData.professionalPlanPrice}
                  onChange={handleInputChange}
                  disabled={isSaving}
                  step="0.01"
                  min="0"
                />
              )}
            </div>
          </div>
        </Card>

        {/* Professional Plan Details */}
        <Card className="p-6 md:p-8 shadow-sm border-gray-200">
          <div className="flex items-center gap-2 mb-6 border-b pb-4">
            <ListChecks className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-800">
              Professional Plan Details
            </h2>
          </div>

          <div className="space-y-6">
            {/* Billing Interval */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Interval Count
                </label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <Input
                    type="number"
                    name="professionalPlanIntervalCount"
                    value={formData.professionalPlanIntervalCount}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    min="1"
                  />
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Interval Unit
                </label>
                {isLoading ? (
                  <Skeleton className="h-10 w-full" />
                ) : (
                  <select
                    name="professionalPlanIntervalUnit"
                    value={formData.professionalPlanIntervalUnit}
                    onChange={handleInputChange}
                    disabled={isSaving}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="months">Months</option>
                    <option value="years">Years</option>
                  </select>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Plan Description
              </label>
              {isLoading ? (
                <Skeleton className="h-10 w-full" />
              ) : (
                <Input
                  type="text"
                  name="professionalPlanDescription"
                  value={formData.professionalPlanDescription}
                  onChange={handleInputChange}
                  disabled={isSaving}
                />
              )}
            </div>

            {/* Features */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Plan Features
              </label>

              {isLoading ? (
                <Skeleton className="h-40 w-full" />
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      disabled={isSaving}
                      placeholder="Add a feature..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddFeature();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      onClick={handleAddFeature}
                      disabled={isSaving || !normalizedFeatureInput}
                      className="shrink-0"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add
                    </Button>
                  </div>

                  <div className="mt-3 rounded-md border border-input bg-background">
                    {formData.professionalPlanFeatures.length === 0 ? (
                      <div className="p-4 text-sm text-gray-500">
                        No features added yet.
                      </div>
                    ) : (
                      <ul className="divide-y">
                        {formData.professionalPlanFeatures.map((feature, idx) => (
                          <li
                            key={`${feature}-${idx}`}
                            className="flex items-center justify-between gap-3 p-3"
                          >
                            <span className="text-sm text-gray-800">
                              {feature}
                            </span>
                            <Button
                              type="button"
                              variant="ghost"
                              onClick={() => handleRemoveFeature(idx)}
                              disabled={isSaving}
                              className="text-gray-500 hover:text-red-600"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={isSaving || isLoading}
            className="w-full md:w-48 bg-blue-600 hover:bg-blue-700 text-white py-6"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving Changes
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </form>

      {/* ✅ Change Password Modal */}
      <Dialog
        open={isPasswordModalOpen}
        onOpenChange={(open) => {
          if (isChangingPassword) return; // prevent closing while submitting
          setIsPasswordModalOpen(open);
          if (!open) {
            setPasswordForm({
              currentPassword: "",
              newPassword: "",
              confirmPassword: "",
            });
            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);
          }
        }}
      >
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleChangePassword} className="space-y-4">
            {/* Current Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Current Password
              </label>
              <div className="relative">
                <Input
                  type={showCurrentPassword ? "text" : "password"}
                  name="currentPassword"
                  value={passwordForm.currentPassword}
                  onChange={handlePasswordInputChange}
                  disabled={isChangingPassword}
                  placeholder="Enter current password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword((v) => !v)}
                  disabled={isChangingPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={
                    showCurrentPassword
                      ? "Hide current password"
                      : "Show current password"
                  }
                >
                  {showCurrentPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                New Password
              </label>
              <div className="relative">
                <Input
                  type={showNewPassword ? "text" : "password"}
                  name="newPassword"
                  value={passwordForm.newPassword}
                  onChange={handlePasswordInputChange}
                  disabled={isChangingPassword}
                  placeholder="Enter new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword((v) => !v)}
                  disabled={isChangingPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={
                    showNewPassword ? "Hide new password" : "Show new password"
                  }
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={passwordForm.confirmPassword}
                  onChange={handlePasswordInputChange}
                  disabled={isChangingPassword}
                  placeholder="Confirm new password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  disabled={isChangingPassword}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={closePasswordModal}
                disabled={isChangingPassword}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isChangingPassword}>
                {isChangingPassword ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Password"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
