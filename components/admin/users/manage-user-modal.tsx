"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
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
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, examAPI, paymentAPI, resourceAPI, userAPI } from "@/lib/api";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RefundModal } from "./refund-modal";

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
  { id: "manage_resource_store", label: "Manage resource store" },
];

const normalizeId = (value: unknown): string | null => {
  if (typeof value === "string" || typeof value === "number") {
    return String(value);
  }

  if (value && typeof value === "object") {
    const record = value as Record<string, unknown>;
    const byObjectId = record._id;
    const byId = record.id;

    if (typeof byObjectId === "string" || typeof byObjectId === "number") {
      return String(byObjectId);
    }

    if (typeof byId === "string" || typeof byId === "number") {
      return String(byId);
    }

    if (typeof record.toString === "function") {
      const asString = record.toString();
      if (asString && asString !== "[object Object]") {
        return asString;
      }
    }
  }

  return null;
};

const getExamUnlockSourceLabel = (purchaseType?: string | null) => {
  if (purchaseType === "manual") return "manual";
  if (purchaseType === "plan") return "plan";
  if (purchaseType === "exam") return "paid";
  return "paid/plan";
};

const getRefundStatusBadge = (tx: any) => {
  const refundStatus = tx.refundStatus;
  const status = tx.status;
  if (refundStatus === "full" || status === "refunded") {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-[10px]">Fully Refunded</Badge>;
  }
  if (refundStatus === "partial") {
    return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100 text-[10px]">Partially Refunded</Badge>;
  }
  if (status === "completed") {
    return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 text-[10px]">Completed</Badge>;
  }
  return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100 text-[10px]">{status ?? "—"}</Badge>;
};

function TransactionHistory({
  userId,
  formatDateTime,
}: {
  userId: string;
  formatDateTime: (v?: string | Date | null) => string;
}) {
  const { data, isLoading } = useQuery(
    ["user-transactions", userId],
    () => paymentAPI.getUserTransactions(userId),
    {
      enabled: Boolean(userId),
      staleTime: 0,
      select: (res) => res.data?.data as any[],
    }
  );

  const transactions: any[] = data ?? [];

  if (!userId) return null;

  return (
    <div className="space-y-3">
      <Label className="text-slate-700 font-bold">Transaction &amp; Refund History</Label>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        {isLoading ? (
          <p className="text-sm text-slate-500">Loading transactions...</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-slate-500">No transactions found.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx: any) => {
              const label =
                tx.transactionType === "plan"
                  ? `Plan Purchase${tx.examId?.name ? ` — ${tx.examId.name}` : ""}`
                  : `Resource Purchase${tx.productId?.title ? ` — ${tx.productId.title}` : ""}`;
              const paid = tx.totalAmount ?? tx.finalPrice ?? 0;
              const refunded = tx.refundedAmount ?? 0;
              const currency = tx.currency ?? "USD";
              const history: any[] = tx.refundHistory ?? [];

              return (
                <div key={tx._id} className="rounded-lg border border-slate-100 p-3 text-sm space-y-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-semibold text-slate-800">{label}</span>
                    {getRefundStatusBadge(tx)}
                  </div>
                  <div className="flex gap-4 text-xs text-slate-500">
                    <span>Paid: <strong className="text-slate-700">{currency} ${paid.toFixed(2)}</strong></span>
                    {refunded > 0 && (
                      <span>Refunded: <strong className="text-amber-700">{currency} ${refunded.toFixed(2)}</strong></span>
                    )}
                    {tx.provider && <span className="uppercase">{tx.provider}</span>}
                  </div>
                  <p className="text-xs text-slate-400">{formatDateTime(tx.purchasedAt ?? tx.createdAt)}</p>
                  {history.length > 0 && (
                    <div className="mt-2 space-y-1 border-t border-slate-100 pt-2">
                      <p className="text-xs font-medium text-slate-500">Refunds:</p>
                      {history.map((entry: any, idx: number) => (
                        <div key={entry._id ?? idx} className="flex items-center justify-between text-xs bg-slate-50 rounded px-2 py-1">
                          <span className="text-slate-700">
                            {currency} ${entry.amount?.toFixed(2)} — {entry.reason || "No reason"}
                          </span>
                          <span className="text-slate-400">{formatDateTime(entry.refundedAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

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
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    phone: "",
    fullName: "",
    role: "User",
    subscriptionTier: "Starter",
    permissions: [] as string[],
    unlockedExams: [] as string[],
    unlockedResources: [] as string[],
    isActive: true,
    tempPassword: "",
  });
  const [initialUnlockedExamIds, setInitialUnlockedExamIds] = useState<string[]>([]);
  const [initialManualUnlockedExamIds, setInitialManualUnlockedExamIds] = useState<string[]>([]);
  const [initialUnlockedResourceIds, setInitialUnlockedResourceIds] = useState<string[]>([]);
  const [initialManualUnlockedResourceIds, setInitialManualUnlockedResourceIds] = useState<string[]>(
    [],
  );
  const [passwordChangeRequired, setPasswordChangeRequired] = useState(false);
  const [activeDeviceId, setActiveDeviceId] = useState("");
  const [activeInstallationId, setActiveInstallationId] = useState("");
  const [activeSessionId, setActiveSessionId] = useState("");
  const [isClearSessionDialogOpen, setIsClearSessionDialogOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  const { data: userDetailsData, isLoading: isUserDetailsLoading } = useQuery(
    ["admin-user-details", userId],
    () => userAPI.getUserDetails(userId || ""),
    {
      enabled: isOpen && Boolean(userId),
      staleTime: 0,
      refetchOnMount: "always",
      onError: (error: any) => {
        toast.error("Failed to load user details");
        console.error("[v0] User details error:", error);
      },
    },
  );

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

  const { data: resourceProductsData, isLoading: isResourcesLoading } = useQuery(
    ["admin-resource-products-all"],
    () => resourceAPI.listProducts(),
    {
      enabled: isOpen,
      onError: (error: any) => {
        if (error?.response?.status !== 403) {
          toast.error("Failed to load resources");
        }
        console.error("[v0] Resource products error:", error);
      },
    },
  );

  const resourceItems = resourceProductsData?.data?.data || [];

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
  const resolvedUser = userDetailsData?.data?.data || user;

  useEffect(() => {
    if (!isOpen || !resolvedUser) return;
    const name =
      resolvedUser.name ||
      [resolvedUser.firstName, resolvedUser.lastName].filter(Boolean).join(" ") ||
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
    const unlockedExamIds = Array.isArray(resolvedUser.unlockedExams)
      ? resolvedUser.unlockedExams
          .map((e: any) => normalizeId(e?.examId))
          .filter((examId: string | null): examId is string => Boolean(examId))
      : [];
    const manualUnlockedExamIds = Array.isArray(resolvedUser.unlockedExams)
      ? resolvedUser.unlockedExams
          .filter((e: any) => e?.purchaseType === "manual")
          .map((e: any) => normalizeId(e?.examId))
          .filter((examId: string | null): examId is string => Boolean(examId))
      : [];
    const unlockedResourceIds = Array.isArray(resolvedUser.unlockedResources)
      ? resolvedUser.unlockedResources
          .map((resource: any) => normalizeId(resource?.productId))
          .filter((resourceId: string | null): resourceId is string => Boolean(resourceId))
      : [];
    const manualUnlockedResourceIds = Array.isArray(resolvedUser.unlockedResources)
      ? resolvedUser.unlockedResources
          .filter(
            (resource: any) =>
              resource?.unlockMode === "manual" || resource?.isManual === true,
          )
          .map((resource: any) => normalizeId(resource?.productId))
          .filter((resourceId: string | null): resourceId is string => Boolean(resourceId))
      : [];

    setInitialUnlockedExamIds(unlockedExamIds);
    setInitialManualUnlockedExamIds(manualUnlockedExamIds);
    setInitialUnlockedResourceIds(unlockedResourceIds);
    setInitialManualUnlockedResourceIds(manualUnlockedResourceIds);
    setPasswordChangeRequired(Boolean(resolvedUser.mustChangePassword));
    setActiveDeviceId(resolvedUser.activeDeviceId || "");
    setActiveInstallationId(resolvedUser.activeInstallationId || "");
    setActiveSessionId(resolvedUser.activeSessionId || "");
    setFormData({
      phone: resolvedUser.phone || "",
      fullName: name,
      role: roleMap[resolvedUser.role] || "User",
      subscriptionTier: tierMap[resolvedUser.subscriptionTier] || "Starter",
      permissions: Array.isArray(resolvedUser.subAdminPermissions)
        ? resolvedUser.subAdminPermissions
        : [],
      unlockedExams: unlockedExamIds,
      unlockedResources: unlockedResourceIds,
      isActive: (resolvedUser.status || "active") === "active",
      tempPassword: "",
    });
  }, [isOpen, resolvedUser]);

  const { mutate: updateUser, isLoading } = useMutation(
    async () => {
      if (!userId) throw new Error("User ID is required");

      await api.updateUser(userId, formData);

      const nextUnlockedSet = new Set(formData.unlockedExams);
      const initialUnlockedSet = new Set(initialUnlockedExamIds);

      const newUnlocks = Array.from(nextUnlockedSet).filter(
        (examId) => !initialUnlockedSet.has(examId),
      );
      const lockedExamIds = Array.from(initialUnlockedSet).filter(
        (examId) => !nextUnlockedSet.has(examId),
      );
      const nextUnlockedResourceSet = new Set(formData.unlockedResources);
      const initialUnlockedResourceSet = new Set(initialUnlockedResourceIds);
      const newResourceUnlocks = Array.from(nextUnlockedResourceSet).filter(
        (resourceId) => !initialUnlockedResourceSet.has(resourceId),
      );
      const lockedResourceIds = Array.from(initialUnlockedResourceSet).filter(
        (resourceId) => !nextUnlockedResourceSet.has(resourceId),
      );

      if (newUnlocks.length) {
        await paymentAPI.unlockExamsForUserBulk({
          userId,
          examIds: newUnlocks,
        });
      }

      if (lockedExamIds.length) {
        await paymentAPI.lockExamsForUserBulk({
          userId,
          examIds: lockedExamIds,
        });
      }

      if (newResourceUnlocks.length) {
        await resourceAPI.unlockProductsForUserBulk({
          userId,
          productIds: newResourceUnlocks,
        });
      }

      if (lockedResourceIds.length) {
        await resourceAPI.lockProductsForUserBulk({
          userId,
          productIds: lockedResourceIds,
        });
      }
    },
    {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(["admin-user-details", userId]),
          queryClient.invalidateQueries(["users"]),
        ]);
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
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(["admin-user-details", userId]),
          queryClient.invalidateQueries(["users"]),
        ]);
        toast.success("Temporary password set. User will be prompted to change it on next login.");
        setPasswordChangeRequired(true);
        setFormData((prev) => ({ ...prev, tempPassword: "" }));
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || error?.message || "Failed to set password",
        );
      },
    },
  );

  const { mutate: clearInstallationSession, isLoading: isClearingSession } = useMutation(
    async () => {
      if (!userId) throw new Error("User ID is required");
      return userAPI.clearInstallationSession(userId);
    },
    {
      onSuccess: async () => {
        await Promise.all([
          queryClient.invalidateQueries(["admin-user-details", userId]),
          queryClient.invalidateQueries(["users"]),
        ]);
        setActiveDeviceId("");
        setActiveInstallationId("");
        setActiveSessionId("");
        setIsClearSessionDialogOpen(false);
        toast.success("Active installation session cleared");
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to clear installation session",
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

  const toggleExam = (examId: string, isChecked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      unlockedExams: isChecked
        ? prev.unlockedExams.includes(examId)
          ? prev.unlockedExams
          : [...prev.unlockedExams, examId]
        : prev.unlockedExams.filter((e) => e !== examId),
    }));
  };

  const toggleResource = (resourceId: string, isChecked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      unlockedResources: isChecked
        ? prev.unlockedResources.includes(resourceId)
          ? prev.unlockedResources
          : [...prev.unlockedResources, resourceId]
        : prev.unlockedResources.filter((item) => item !== resourceId),
    }));
  };

  const formatDateTime = (value?: string | Date | null) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleString();
  };

  const formatDate = (value?: string | Date | null, fallback = "N/A") => {
    if (!value) return fallback;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return fallback;
    return parsed.toLocaleDateString();
  };

  const userUnlockedExams = Array.isArray(resolvedUser?.unlockedExams)
    ? resolvedUser.unlockedExams
    : [];
  const unlockedResourceEntries = Array.isArray(resolvedUser?.unlockedResources)
    ? resolvedUser.unlockedResources
    : [];
  const examAccessById = useMemo(
    () =>
      userUnlockedExams.reduce((acc: Record<string, any>, item: any) => {
        const examId = normalizeId(item?.examId);
        if (examId) {
          acc[examId] = item;
        }
        return acc;
      }, {}),
    [userUnlockedExams],
  );
  const unlockSourceByExamId = userUnlockedExams.reduce((acc: Record<string, string>, item: any) => {
    const examId = normalizeId(item?.examId);
    if (examId && typeof item?.purchaseType === "string") {
      acc[examId] = item.purchaseType;
    }
    return acc;
  }, {});
  const resourceAccessByProductId = useMemo(
    () =>
      unlockedResourceEntries.reduce((acc: Record<string, any>, item: any) => {
        const productId = normalizeId(item?.productId);
        if (productId) {
          acc[productId] = item;
        }
        return acc;
      }, {}),
    [unlockedResourceEntries],
  );
  const sortedResourceItems = useMemo(
    () =>
      [...resourceItems].sort((a: any, b: any) => {
        const categoryA = String(a?.categoryId?.title || "").toLowerCase();
        const categoryB = String(b?.categoryId?.title || "").toLowerCase();
        if (categoryA !== categoryB) return categoryA.localeCompare(categoryB);
        return String(a?.title || "").toLowerCase().localeCompare(String(b?.title || "").toLowerCase());
      }),
    [resourceItems],
  );
  const initialUnlockedExamIdSet = new Set(initialUnlockedExamIds);
  const initialManualUnlockedExamIdSet = new Set(initialManualUnlockedExamIds);
  const initialUnlockedResourceIdSet = new Set(initialUnlockedResourceIds);
  const initialManualUnlockedResourceIdSet = new Set(initialManualUnlockedResourceIds);
  const paidExamPurchases = userUnlockedExams.filter(
    (item: any) => item?.purchaseType === "exam" && item?.paymentStatus === "completed",
  ).length;
  const planPurchases = userUnlockedExams.filter(
    (item: any) => item?.purchaseType === "plan" && item?.paymentStatus === "completed",
  ).length;
  const manualUnlocks = userUnlockedExams.filter(
    (item: any) => item?.purchaseType === "manual",
  ).length;
  const latestPurchaseAt = userUnlockedExams
    .map((item: any) => item?.purchasedAt)
    .filter(Boolean)
    .sort((a: string, b: string) => new Date(b).getTime() - new Date(a).getTime())[0];
  const manualResourceUnlocks = unlockedResourceEntries.filter(
    (item: any) => item?.unlockMode === "manual" || item?.isManual === true,
  ).length;
  const paidOrPlanResourceUnlocks = unlockedResourceEntries.length - manualResourceUnlocks;
  const normalizedTier = (resolvedUser?.subscriptionTier || "starter")
    .toString()
    .toLowerCase();
  const isProfessional = normalizedTier === "professional";
  const resolvedActiveDeviceId = activeDeviceId || activeInstallationId;
  const hasActiveDeviceSession = Boolean(
    resolvedActiveDeviceId || activeSessionId,
  );

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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
            <div className="space-y-2 sm:col-span-2">
              <Label>Active Device</Label>
              <div className="flex items-start justify-between gap-3 rounded-lg border border-slate-200 bg-white p-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 break-all">
                    {resolvedActiveDeviceId || "No active device"}
                  </p>
                  {activeSessionId ? (
                    <p className="mt-1 text-xs text-slate-500 break-all">
                      Session ID: {activeSessionId}
                    </p>
                  ) : null}
                </div>
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="shrink-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                  disabled={!hasActiveDeviceSession || isClearingSession}
                  onClick={() => setIsClearSessionDialogOpen(true)}
                >
                  {isClearingSession ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Billing & Subscription Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-slate-700 font-bold">Billing &amp; Subscription Summary</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="gap-2 border-[#1E3A8A] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white"
                onClick={() => setIsRefundModalOpen(true)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Refund
              </Button>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-slate-500">Signed up</p>
                  <p className="font-semibold text-slate-800">{formatDateTime(resolvedUser?.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Current plan</p>
                  <p className="font-semibold text-slate-800">
                    {isProfessional ? "Professional" : "Starter"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Plan started</p>
                  <p className="font-semibold text-slate-800">
                    {isProfessional
                      ? formatDateTime(resolvedUser?.subscriptionStartedAt)
                      : "N/A (Starter plan)"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Plan expires</p>
                  <p className="font-semibold text-slate-800">
                    {isProfessional
                      ? formatDateTime(resolvedUser?.subscriptionExpiresAt)
                      : "N/A (Starter plan)"}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Plan purchases (completed)</p>
                  <p className="font-semibold text-slate-800">{planPurchases}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Exam purchases (completed)</p>
                  <p className="font-semibold text-slate-800">{paidExamPurchases}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Manual unlocks</p>
                  <p className="font-semibold text-slate-800">{manualUnlocks}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500">Latest billing activity</p>
                  <p className="font-semibold text-slate-800">{formatDateTime(latestPurchaseAt)}</p>
                </div>
              </div>
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
                  {examItems.map((exam: any) => {
                    const examId = normalizeId(exam?._id ?? exam?.id);
                    if (!examId) return null;

                    const existingExamAccess = examAccessById[examId];
                    const isUnlocked = formData.unlockedExams.includes(examId);
                    const purchaseType = unlockSourceByExamId[examId];
                    const isNonManualUnlock = Boolean(
                      isUnlocked &&
                      initialUnlockedExamIdSet.has(examId) &&
                      !initialManualUnlockedExamIdSet.has(examId),
                    );
                    const unlockStateLabel = !isUnlocked
                      ? "Locked"
                      : isNonManualUnlock
                        ? `Unlocked (${getExamUnlockSourceLabel(purchaseType)})`
                        : "Unlocked (manual)";

                    return (
                      <div key={examId} className="flex items-center space-x-2">
                        <Checkbox
                          id={examId}
                          className="h-4 w-4 rounded-[4px] border-slate-300 bg-white data-[state=checked]:bg-[#1E3A8A] data-[state=checked]:border-[#1E3A8A]"
                          checked={isUnlocked}
                          onCheckedChange={(checked) => toggleExam(examId, checked === true)}
                        />
                        <div className="min-w-0">
                          <Label
                            htmlFor={examId}
                            className="text-sm cursor-pointer"
                          >
                            {exam.name}
                          </Label>
                          <p className={`text-xs ${isUnlocked ? "text-emerald-700" : "text-slate-500"}`}>
                            {unlockStateLabel}
                          </p>
                          {isUnlocked && existingExamAccess ? (
                            <>
                              <p className="text-[11px] text-slate-500">
                                Unlock date: {formatDate(existingExamAccess?.unlockDate)}
                              </p>
                              <p
                                className={`text-[11px] ${
                                  existingExamAccess?.isExpired
                                    ? "text-red-600"
                                    : "text-slate-500"
                                }`}
                              >
                                Expiry: {formatDate(existingExamAccess?.expiresAt, "No expiry")}
                              </p>
                            </>
                          ) : null}
                          {isUnlocked && !existingExamAccess ? (
                            <p className="text-[11px] text-slate-500">
                              Unlock will be applied when you save.
                            </p>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Resource Access */}
          <div className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <Label>Resource Access</Label>
                <p className="text-xs text-slate-500">
                  Review unlocked resources and use the controls below to lock or unlock access.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">
                  Manual: {manualResourceUnlocks}
                </Badge>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                  Paid/plan: {paidOrPlanResourceUnlocks}
                </Badge>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4">
              {isUserDetailsLoading ? (
                <p className="text-sm text-slate-500">Loading unlocked resources...</p>
              ) : unlockedResourceEntries.length === 0 ? (
                <p className="text-sm text-slate-500">No resources unlocked for this user.</p>
              ) : (
                <ScrollArea className="h-64 sm:h-72">
                  <div className="space-y-3 pr-4">
                    {unlockedResourceEntries.map((resource: any) => {
                      const resourceKey =
                        normalizeId(resource?.productId) ||
                        resource?.productCode ||
                        resource?.title;
                      const isManual =
                        resource?.unlockMode === "manual" || resource?.isManual === true;
                      const sourceDetail = resource?.inheritedFromBundle
                        ? `via ${resource?.sourceProductTitle || resource?.sourceProductCode || "bundle"}`
                        : resource?.sourceProductTitle &&
                            resource?.sourceProductTitle !== resource?.title
                          ? `from ${resource.sourceProductTitle}`
                          : "";

                      return (
                        <div
                          key={resourceKey}
                          className="rounded-lg border border-slate-200 bg-slate-50/80 p-3"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-slate-800">
                                {resource?.title || resource?.productCode || "Resource"}
                              </p>
                              <div className="mt-2 flex flex-wrap gap-2">
                                <Badge
                                  className={
                                    isManual
                                      ? "bg-amber-100 text-amber-800 hover:bg-amber-100"
                                      : "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                                  }
                                >
                                  {isManual ? "Manual" : "Paid/plan-based"}
                                </Badge>
                                {resource?.categoryTitle ? (
                                  <Badge
                                    variant="outline"
                                    className="border-slate-200 text-slate-600"
                                  >
                                    {resource.categoryTitle}
                                  </Badge>
                                ) : null}
                                {resource?.isBundle ? (
                                  <Badge
                                    variant="outline"
                                    className="border-slate-200 text-slate-600"
                                  >
                                    Bundle
                                  </Badge>
                                ) : null}
                              </div>
                              <p className="mt-2 text-xs text-slate-600">
                                {resource?.sourceLabel || (isManual ? "Manual unlock" : "Paid/plan-based")}
                                {sourceDetail ? ` ${sourceDetail}` : ""}
                              </p>
                            </div>
                            <div className="text-xs text-slate-500 sm:text-right">
                              <p>Unlock date: {formatDate(resource?.purchasedAt)}</p>
                              <p className="mt-1">
                                Expiry: {formatDate(resource?.expiresAt, "No expiry")}
                              </p>
                              {resource?.provider ? (
                                <p className="mt-1 uppercase tracking-wide">
                                  {resource.provider}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>

            <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
              <div className="mb-3">
                <p className="text-sm font-semibold text-slate-800">
                  Lock or unlock resources
                </p>
                <p className="text-xs text-slate-500">
                  Changes are applied when you save the user.
                </p>
              </div>
              {isResourcesLoading ? (
                <p className="text-sm text-slate-500">Loading resources...</p>
              ) : sortedResourceItems.length === 0 ? (
                <p className="text-sm text-slate-500">No resources found.</p>
              ) : (
                <ScrollArea className="h-72 sm:h-80">
                  <div className="grid grid-cols-1 gap-3 pr-4 sm:grid-cols-2">
                    {sortedResourceItems.map((resource: any) => {
                      const resourceId = normalizeId(resource?._id ?? resource?.id);
                      if (!resourceId) return null;

                      const existingAccess = resourceAccessByProductId[resourceId];
                      const isUnlocked = formData.unlockedResources.includes(resourceId);
                      const isNonManualUnlock = Boolean(
                        isUnlocked &&
                        initialUnlockedResourceIdSet.has(resourceId) &&
                        !initialManualUnlockedResourceIdSet.has(resourceId),
                      );
                      const unlockStateLabel = !isUnlocked
                        ? "Locked"
                        : isNonManualUnlock
                          ? `Unlocked (${existingAccess?.sourceLabel || "paid/plan-based"})`
                          : "Unlocked (manual)";

                      return (
                        <div
                          key={resourceId}
                          className="flex items-start space-x-2 rounded-lg border border-white/70 bg-white/80 p-3"
                        >
                          <Checkbox
                            id={`resource-${resourceId}`}
                            className="mt-0.5 h-4 w-4 rounded-[4px] border-slate-300 bg-white data-[state=checked]:bg-[#1E3A8A] data-[state=checked]:border-[#1E3A8A]"
                            checked={isUnlocked}
                            onCheckedChange={(checked) =>
                              toggleResource(resourceId, checked === true)
                            }
                          />
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <Label
                                htmlFor={`resource-${resourceId}`}
                                className="cursor-pointer text-sm"
                              >
                                {resource.title}
                              </Label>
                              {resource?.isBundle ? (
                                <Badge
                                  variant="outline"
                                  className="border-slate-200 text-slate-600"
                                >
                                  Bundle
                                </Badge>
                              ) : null}
                              {!resource?.isActive ? (
                                <Badge
                                  variant="outline"
                                  className="border-orange-200 text-orange-700"
                                >
                                  Inactive
                                </Badge>
                              ) : null}
                            </div>
                            {resource?.categoryId?.title ? (
                              <p className="mt-1 text-xs text-slate-500">
                                {resource.categoryId.title}
                              </p>
                            ) : null}
                            <p
                              className={`mt-1 text-xs ${
                                isUnlocked ? "text-emerald-700" : "text-slate-500"
                              }`}
                            >
                              {unlockStateLabel}
                            </p>
                            {isUnlocked && existingAccess ? (
                              <>
                                <p className="mt-1 text-[11px] text-slate-500">
                                  Unlock date: {formatDate(existingAccess?.purchasedAt)}
                                </p>
                                <p className="mt-1 text-[11px] text-slate-500">
                                  Expiry: {formatDate(existingAccess?.expiresAt, "No expiry")}
                                </p>
                              </>
                            ) : null}
                            {isUnlocked && !existingAccess ? (
                              <p className="mt-1 text-[11px] text-slate-500">
                                Unlock will be applied when you save.
                              </p>
                            ) : null}
                            {existingAccess?.inheritedFromBundle &&
                            existingAccess?.sourceProductTitle ? (
                              <p className="mt-1 text-xs text-slate-500">
                                Granted via {existingAccess.sourceProductTitle}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
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

          {/* Transaction & Refund History */}
          <TransactionHistory userId={userId || ""} formatDateTime={formatDateTime} />

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
            <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm">
              <span className="text-slate-500">Password update required on next login:</span>{" "}
              <span className={`font-semibold ${passwordChangeRequired ? "text-amber-600" : "text-emerald-600"}`}>
                {passwordChangeRequired ? "Yes" : "No"}
              </span>
            </div>
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
              disabled={isLoading || isUserDetailsLoading}
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

      <AlertDialog
        open={isClearSessionDialogOpen}
        onOpenChange={setIsClearSessionDialogOpen}
      >
        <AlertDialogContent className="bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete active device session?</AlertDialogTitle>
            <AlertDialogDescription>
              This will clear the user's active device/session and force a re-login.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3">
            <AlertDialogCancel className="rounded-lg">No</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => clearInstallationSession()}
              className="rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              Yes
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {userId && (
        <RefundModal
          isOpen={isRefundModalOpen}
          userId={userId}
          userName={userName}
          onClose={() => setIsRefundModalOpen(false)}
        />
      )}
    </Dialog>
  );
}
