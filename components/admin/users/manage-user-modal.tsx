"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { api, examAPI, paymentAPI, userAPI } from "@/lib/api";
import { Loader2 } from "lucide-react";

const PERMISSIONS = [
  { id: "view_user_list", label: "View user list" },
  { id: "send_password_reset_email", label: "Send password reset email" },
  { id: "suspend_users", label: "Suspend or unsuspend users" },
  { id: "manage_exams_questions", label: "Manage exams & questions" },
  { id: "view_billing_summary", label: "View billing summary" },
  { id: "edit_user_profiles", label: "Edit user profiles" },
  { id: "manage_subscription", label: "Manage subscription" },
  { id: "manage_announcements", label: "Manage announcements" },
  { id: "access_performance_analytics", label: "Access performance analytics" },
  { id: "view_activity_logs", label: "View activity logs" },
  { id: "manual_exam_unlocks", label: "Manual exam unlocks" },
  { id: "credential_management", label: "Credential management" },
];

interface ManageUserModalProps {
  isOpen: boolean;
  userId?: string;
  user?: any;
  userName?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ManageUserModal({
  isOpen,
  userId,
  user,
  userName,
  onClose,
  onSuccess,
}: ManageUserModalProps) {
  const [formData, setFormData] = useState({
    phone: "",
    fullName: "",
    role: "User",
    subscriptionTier: "Starter",
    permissions: [] as string[],
    unlockedExams: [] as string[],
    isActive: true,
    tempPassword: "",
  });
  const [initialUnlockedExamIds, setInitialUnlockedExamIds] = useState<string[]>([]);

  const { data: examsData, isLoading: isExamsLoading } = useQuery(
    ["admin-exams-all"],
    () => examAPI.listAllExams(1, 200),
    {
      enabled: isOpen,
      onError: (error: any) => {
        toast.error("Failed to load exams");
        console.error("[v0] Exams error:", error);
      },
    },
  );

  const examItems = examsData?.data?.data?.exams || [];

  const { data: examReviewsData, isLoading: isReviewsLoading } = useQuery(
    ["user-exam-reviews", userId],
    () => userAPI.getUserExamReviews(userId || ""),
    {
      enabled: isOpen && Boolean(userId),
      onError: (error: any) => {
        toast.error("Failed to load exam reviews");
        console.error("[v0] Exam reviews error:", error);
      },
    },
  );

  const examReviews = examReviewsData?.data?.data || [];

  useEffect(() => {
    if (!isOpen || !user) return;
    const name =
      user.name ||
      [user.firstName, user.lastName].filter(Boolean).join(" ") ||
      "";
    const roleMap: Record<string, string> = {
      user: "User",
      "sub-admin": "Sub-Admin",
      admin: "Admin",
      storeman: "Storeman",
    };
    const tierMap: Record<string, string> = {
      starter: "Starter",
      professional: "Professional",
    };
    const unlockedExamIds = Array.isArray(user.unlockedExams)
      ? user.unlockedExams
          .map((e: any) => e?.examId?.toString?.() || e?.examId)
          .filter(Boolean)
      : [];

    setInitialUnlockedExamIds(unlockedExamIds);
    setFormData({
      phone: user.phone || "",
      fullName: name,
      role: roleMap[user.role] || "User",
      subscriptionTier: tierMap[user.subscriptionTier] || "Starter",
      permissions: Array.isArray(user.subAdminPermissions)
        ? user.subAdminPermissions
        : [],
      unlockedExams: unlockedExamIds,
      isActive: (user.status || "active") === "active",
      tempPassword: "",
    });
  }, [isOpen, user]);

  const { mutate: updateUser, isLoading } = useMutation(
    async () => {
      if (!userId) throw new Error("User ID is required");

      await api.updateUser(userId, formData);

      const newUnlocks = formData.unlockedExams.filter(
        (examId) => !initialUnlockedExamIds.includes(examId),
      );

      if (newUnlocks.length) {
        await Promise.all(
          newUnlocks.map((examId) =>
            paymentAPI.unlockExamForUser(examId, { userId }),
          ),
        );
      }
    },
    {
      onSuccess: () => {
        toast.success("User updated successfully");
        onSuccess?.();
        onClose();
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to update user");
      },
    },
  );

  const { mutate: setTempPassword, isLoading: isSettingPassword } = useMutation(
    async () => {
      if (!userId) throw new Error("User ID is required");
      const password = formData.tempPassword?.trim();
      if (!password) throw new Error("Temporary password is required");
      await userAPI.setTemporaryPassword(userId, { password });
    },
    {
      onSuccess: () => {
        toast.success("Temporary password set");
        setFormData((prev) => ({ ...prev, tempPassword: "" }));
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || error?.message || "Failed to set password",
        );
      },
    },
  );

  const togglePermission = (permissionId: string) => {
    setFormData((prev) => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter((p) => p !== permissionId)
        : [...prev.permissions, permissionId],
    }));
  };

  const toggleExam = (examId: string) => {
    setFormData((prev) => ({
      ...prev,
      unlockedExams: prev.unlockedExams.includes(examId)
        ? prev.unlockedExams.filter((e) => e !== examId)
        : [...prev.unlockedExams, examId],
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-3xl max-h-[90vh] overflow-y-auto"
        style={{
          background:
            "linear-gradient(180deg, #FFFFFF 0%, #E5EEFF 20.91%, #EDF3FF 41.83%, #DEE9FF 69.71%, #FFFFFF 100%)",
        }}
      >
        <DialogHeader>
          <DialogTitle>Manage User: {userName}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number (Optional)</Label>
              <Input
                id="phone"
                placeholder="+997 9384u35803"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="Butlar Mane"
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
              />
            </div>
          </div>

          {/* Role & Subscription */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) =>
                  setFormData({ ...formData, role: value })
                }
              >
                <SelectTrigger id="role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="User">User</SelectItem>
                  <SelectItem value="Sub-Admin">Sub-Admin</SelectItem>
                  <SelectItem value="Admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="tier">Subscription Tier</Label>
              <Select
                value={formData.subscriptionTier}
                onValueChange={(value) =>
                  setFormData({ ...formData, subscriptionTier: value })
                }
              >
                <SelectTrigger id="tier">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white">
                  <SelectItem value="Starter">Starter</SelectItem>
                  <SelectItem value="Professional">Professional</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Sub Admin Permissions */}
          {formData.role === "Sub-Admin" && (
            <div className="space-y-3">
              <Label>Sub Admin Permission</Label>
              <div className="grid grid-cols-2 gap-3">
                {PERMISSIONS.map((permission) => (
                  <div
                    key={permission.id}
                    className="flex items-center space-x-2"
                  >
                    <Checkbox
                      id={permission.id}
                      checked={formData.permissions.includes(permission.id)}
                      onCheckedChange={() => togglePermission(permission.id)}
                    />
                    <Label htmlFor={permission.id} className="cursor-pointer">
                      {permission.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Manual Exam Unlocks */}
          <div className="space-y-3">
            <Label>Manual Exam Unlocks</Label>
            <div className="bg-blue-50 dark:bg-slate-900 p-4 rounded-lg max-h-60 overflow-y-auto">
              {isExamsLoading ? (
                <p className="text-sm text-gray-500">Loading exams...</p>
              ) : examItems.length === 0 ? (
                <p className="text-sm text-gray-500">No exams found</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {examItems.map((exam: any) => (
                    <div key={exam._id} className="flex items-center space-x-2">
                      <Checkbox
                        id={exam._id}
                        checked={formData.unlockedExams.includes(exam._id)}
                        onCheckedChange={() => toggleExam(exam._id)}
                      />
                      <Label
                        htmlFor={exam._id}
                        className="text-sm cursor-pointer"
                      >
                        {exam.name}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Exam Reviews */}
          <div className="space-y-3">
            <Label>Exam Reviews</Label>
            <div className="bg-white p-4 rounded-lg border border-slate-200 max-h-56 overflow-y-auto">
              {isReviewsLoading ? (
                <p className="text-sm text-gray-500">Loading reviews...</p>
              ) : examReviews.length === 0 ? (
                <p className="text-sm text-gray-500">No reviews yet</p>
              ) : (
                <div className="space-y-3">
                  {examReviews.map((review: any) => (
                    <div
                      key={review.reviewId}
                      className="border border-slate-100 rounded-lg p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-sm font-semibold text-slate-800">
                          {review.examName || "Exam"}
                        </div>
                        <div className="text-xs text-slate-500">
                          {review.updatedAt
                            ? new Date(review.updatedAt).toLocaleDateString()
                            : ""}
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-slate-600">
                        Rating: {review.stars}/5
                      </div>
                      {review.feedbackText ? (
                        <p className="mt-2 text-sm text-slate-700">
                          {review.feedbackText}
                        </p>
                      ) : (
                        <p className="mt-2 text-sm text-slate-400">
                          No feedback text
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Account Status */}
          <div className="space-y-3">
            <Label className="text-slate-700 font-bold">Account Status</Label>
            <div className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200 shadow-sm transition-all">
              <div className="flex items-center gap-3">
                <Switch
                  id="account-status"
                  checked={formData.isActive}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isActive: checked })
                  }
                  // Custom color classes for the checked state
                  className="data-[state=checked]:bg-[#1E3A8A] data-[state=unchecked]:bg-slate-200"
                />
                <span
                  className={`text-sm font-semibold transition-colors ${
                    formData.isActive ? "text-[#1E3A8A]" : "text-slate-400"
                  }`}
                >
                  {formData.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {/* Subtle status indicator dot */}
              <div
                className={`w-2 h-2 rounded-full ${formData.isActive ? "bg-green-500 animate-pulse" : "bg-slate-300"}`}
              />
            </div>
          </div>

          {/* Credential Management */}
          <div className="space-y-3">
            <Label className="text-slate-700 font-bold">Credential Management</Label>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Input
                placeholder="Enter a temporary Password...."
                value={formData.tempPassword}
                onChange={(e) =>
                  setFormData({ ...formData, tempPassword: e.target.value })
                }
              />
              <Button
                type="button"
                className="sm:w-auto bg-[#1E3A8A] hover:bg-[#152a61] text-white rounded-full px-6"
                onClick={() => setTempPassword()}
                disabled={isSettingPassword || !formData.tempPassword?.trim()}
              >
                {isSettingPassword ? "Setting..." : "Set Password"}
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => updateUser()}
              disabled={isLoading}
              className="ml-auto"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
