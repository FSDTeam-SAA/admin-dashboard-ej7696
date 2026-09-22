"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { paymentAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AddPlanModal } from "@/components/admin/subscriptions/plan-modal";
import { ExamStoreProductsModal } from "@/components/admin/subscriptions/exam-store-products-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Sparkles, Zap, Check, Pencil, RefreshCw, Trash2 } from "lucide-react";

type PlanItem = {
  id: string;
  text: string;
};

type PlanCard = {
  id: string;
  name: string;
  price: number;
  duration: string;
  items: PlanItem[];
  note: string;
  status: string;
  accent: "starter" | "pro";
  professionalPlanPrice?: number;
  editable: boolean;
};

type StoreUpdateItem = {
  productId: string;
  basePlanId?: string;
  status: string;
  storeProductStatus?: string;
  error?: string;
};

type StoreUpdateProvider = {
  status: string;
  items?: StoreUpdateItem[];
  error?: string;
};

type StorePriceUpdate = {
  _id: string;
  target: "professional_plan" | "exam_unlock";
  oldPrice: number;
  newPrice: number;
  currency: string;
  status: string;
  apple: StoreUpdateProvider;
  google: StoreUpdateProvider;
  database: StoreUpdateProvider;
  initiatedBy?: { name?: string; email?: string };
  retryCount?: number;
  lastError?: string;
  createdAt: string;
};

const statusClass = (status: string) => {
  if (status === "confirmed" || status === "completed") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (["failed", "partial"].includes(status)) {
    return "border-red-200 bg-red-50 text-red-700";
  }
  if (status === "skipped") {
    return "border-slate-200 bg-slate-50 text-slate-600";
  }
  return "border-amber-200 bg-amber-50 text-amber-700";
};

const providerSummary = (provider?: StoreUpdateProvider) => {
  const items = provider?.items ?? [];
  if (!items.length) return provider?.status ?? "pending";
  const confirmed = items.filter((item) => item.status === "confirmed").length;
  return `${provider?.status ?? "pending"} (${confirmed}/${items.length})`;
};

const starterFeatures = [
  "16 free practice questions per month",
  "Explore all certifications",
  "Up to 2 practice questions per certification",
  "Upgrade anytime for full access",
];

const defaultProFeatures = [
  "Access to selected API exams",
  "Full-length mock exams",
  "Timed & Full Simulation Modes",
  "Interactive study mode",
  "Progress tracking, Performance Dashboard & exam history",
  "Detailed explanations with code references",
];

const formatPrice = (value: number) =>
  value === 0 ? "Free" : `$${value.toFixed(2)}`;

const normalizeDuration = (count: number, unit: string) => {
  const safeUnit = unit || "months";
  const label = count === 1 ? safeUnit.replace(/s$/, "") : safeUnit;
  return `${count} ${label}`;
};

const mapDurationToSelect = (duration: string) => {
  const value = duration.toLowerCase();
  if (value.includes("6") || value.includes("six")) return "Six Months";
  if (value.includes("3") || value.includes("three")) return "Three Months";
  return "One Month";
};

export default function SubscriptionsPage() {
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanCard | null>(null);
  const [isExamPriceModalOpen, setIsExamPriceModalOpen] = useState(false);
  const [isExamProductsModalOpen, setIsExamProductsModalOpen] = useState(false);
  const [examUnlockPrice, setExamUnlockPrice] = useState("");
  const [isReferralCommissionModalOpen, setIsReferralCommissionModalOpen] =
    useState(false);
  const [referralCommissionPercent, setReferralCommissionPercent] =
    useState("");
  const [pendingDeleteJob, setPendingDeleteJob] =
    useState<StorePriceUpdate | null>(null);

  const {
    data: pricingData,
    isLoading,
    refetch,
  } = useQuery("pricing-settings", paymentAPI.getPricingSettings, {
    keepPreviousData: true,
  });

  const pricing = pricingData?.data?.data;
  const {
    data: updateHistoryData,
    refetch: refetchUpdateHistory,
    isLoading: isHistoryLoading,
  } = useQuery(
    "coordinated-price-updates",
    () => paymentAPI.getCoordinatedPriceUpdates({ limit: 20 }),
    {
      refetchInterval: 5000,
      onSuccess: () => refetch(),
    },
  );
  const updateHistory: StorePriceUpdate[] = updateHistoryData?.data?.data ?? [];

  const { mutate: retryPriceUpdate, isLoading: isRetryingPriceUpdate } =
    useMutation(
      (jobId: string) => paymentAPI.retryCoordinatedPriceUpdate(jobId),
      {
        onSuccess: () => {
          toast.success("Price update retry queued");
          refetchUpdateHistory();
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message || error?.message || "Failed to retry price update",
          );
        },
      },
    );
  const { mutate: deletePriceUpdate, isLoading: isDeletingPriceUpdate } =
    useMutation(
      (jobId: string) => paymentAPI.deleteCoordinatedPriceUpdate(jobId),
      {
        onSuccess: () => {
          toast.success("Failed price update history deleted");
          setPendingDeleteJob(null);
          refetchUpdateHistory();
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Failed to delete price update history",
          );
        },
      },
    );

  const handleDeletePriceUpdate = (job: StorePriceUpdate) => {
    setPendingDeleteJob(job);
  };
  const hideAddNewPlan = Number(pricing?.professionalPlanPrice) === 170;
  const currentReferralCommissionPercent = useMemo(() => {
    const rate = Number(pricing?.referralCommissionRate ?? 0.1);
    if (!Number.isFinite(rate)) return 10;
    return Math.round((rate * 100 + Number.EPSILON) * 100) / 100;
  }, [pricing?.referralCommissionRate]);

  const { mutate: updateExamPrice, isLoading: isUpdatingExamPrice } =
    useMutation(
      async () => {
        const price = Number(examUnlockPrice);
        if (!Number.isFinite(price) || price <= 0) {
          throw new Error("Exam unlock price must be a positive number");
        }

        return paymentAPI.startCoordinatedPriceUpdate({
          target: "exam_unlock",
          price,
          currency: "USD",
        });
      },
      {
        onSuccess: () => {
          toast.success("Exam unlock coordinated price update started");
          setIsExamPriceModalOpen(false);
          refetchUpdateHistory();
        },
        onError: (error: any) => {
          toast.error(
            error?.response?.data?.message ||
              error?.message ||
              "Failed to start exam unlock price update",
          );
        },
      },
    );

  const {
    mutate: updateReferralCommission,
    isLoading: isUpdatingReferralCommission,
  } = useMutation(
    async () => {
      const commissionPercent = Number(referralCommissionPercent);
      if (
        !Number.isFinite(commissionPercent) ||
        commissionPercent < 0 ||
        commissionPercent > 100
      ) {
        throw new Error("Referral commission must be between 0 and 100");
      }

      return paymentAPI.updatePricing({
        referralCommissionPercent: commissionPercent,
      });
    },
    {
      onSuccess: () => {
        toast.success("Referral commission updated");
        setIsReferralCommissionModalOpen(false);
        refetch();
      },
      onError: (error: any) => {
        toast.error(error?.message || "Failed to update referral commission");
      },
    },
  );

  const plans = useMemo<PlanCard[]>(() => {
    const proPrice = Number(pricing?.professionalPlanPrice ?? 180);
    const proIntervalCount = Number(
      pricing?.professionalPlanIntervalCount ?? 3,
    );
    const proIntervalUnit = pricing?.professionalPlanIntervalUnit ?? "months";
    const proFeatures = Array.isArray(pricing?.professionalPlanFeatures)
      ? pricing.professionalPlanFeatures
      : defaultProFeatures;

    return [
      {
        id: "starter",
        name: "Starter Plan",
        price: 0,
        duration: "",
        items: starterFeatures.map((text, index) => ({
          id: `starter-${index}`,
          text,
        })),
        note: "What's included in your plan",
        status: "Active",
        accent: "starter",
        editable: false,
      },
      {
        id: "professional",
        name: "Professional Plan",
        price: Number.isFinite(proPrice) ? proPrice : 180,
        duration: normalizeDuration(
          Number.isFinite(proIntervalCount) ? proIntervalCount : 3,
          proIntervalUnit,
        ),
        items: (proFeatures.length ? proFeatures : defaultProFeatures).map(
          (text: string, index: number) => ({
            id: `pro-${index}`,
            text,
          }),
        ),
        note:
          pricing?.professionalPlanDescription ||
          "What's included in your plan",
        status: "Active",
        accent: "pro",
        editable: true,
      },
    ];
  }, [pricing]);

  const handleOpenAdd = () => {
    setEditingPlan(null);
    setIsPlanModalOpen(true);
  };

  const handleOpenEdit = (plan: PlanCard) => {
    if (!plan.editable) return;
    setEditingPlan(plan);
    setIsPlanModalOpen(true);
  };

  const handleOpenExamPrice = () => {
    const price = pricing?.examUnlockPrice ?? 150;
    setExamUnlockPrice(String(price));
    setIsExamPriceModalOpen(true);
  };

  const handleOpenReferralCommission = () => {
    setReferralCommissionPercent(String(currentReferralCommissionPercent));
    setIsReferralCommissionModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F8FF] p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            Flexible Plan
          </h1>
          <p className="text-sm text-slate-500">
            Create a plan that works best for you
          </p>
        </div>
        <div className="space-x-2">
          <Button
            className="h-10 rounded-full bg-[#1E3A8A] px-6 text-white hover:bg-[#1C357B]"
            onClick={handleOpenReferralCommission}
          >
            <Plus className="mr-2 h-4 w-4" />
            Referral Commission ({currentReferralCommissionPercent}%)
          </Button>
          <Button
            className="h-10 rounded-full bg-[#1E3A8A] px-6 text-white hover:bg-[#1C357B]"
            onClick={handleOpenExamPrice}
          >
            <Plus className="mr-2 h-4 w-4" />
            Exam Unlock Price
          </Button>
          <Button
            className="h-10 rounded-full bg-[#1E3A8A] px-6 text-white hover:bg-[#1C357B]"
            onClick={() => setIsExamProductsModalOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Exam Store Products
          </Button>
{/* 
          {Number(pricing?.professionalPlanPrice ?? 0) > 0 && !hideAddNewPlan && (
            <Button
              className="h-10 rounded-full bg-[#1E3A8A] px-6 text-white hover:bg-[#1C357B]"
              onClick={handleOpenAdd}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add New Plan
            </Button>
          )} */}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 max-w-5xl">
        {isLoading
          ? Array.from({ length: 2 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <Skeleton className="h-6 w-32" />
                <Skeleton className="mt-3 h-5 w-20" />
                <Skeleton className="mt-4 h-10 w-40" />
                <Skeleton className="mt-6 h-3 w-full" />
                <Skeleton className="mt-2 h-3 w-5/6" />
                <Skeleton className="mt-2 h-3 w-2/3" />
                <Skeleton className="mt-6 h-10 w-full" />
              </div>
            ))
          : plans.map((plan) => (
              <div
                key={plan.id}
                className="rounded-2xl border border-[#D7E3FF] bg-[#EEF3FF] p-6 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1E3A8A] text-white">
                      {plan.accent === "starter" ? (
                        <Sparkles className="h-5 w-5" />
                      ) : (
                        <Zap className="h-5 w-5" />
                      )}
                    </div>
                    <h2 className="text-lg font-semibold text-slate-900">
                      {plan.name}
                    </h2>
                  </div>
                </div>

                <div className="mt-4 flex items-end gap-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {formatPrice(plan.price)}
                  </span>
                  {plan.duration ? (
                    <span className="text-sm text-slate-500">
                      /{plan.duration}
                    </span>
                  ) : null}
                </div>

                <div className="mt-4 h-px w-full bg-slate-200" />

                <h3 className="mt-4 text-sm font-semibold text-slate-700">
                  {plan.note}
                </h3>
                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                  {plan.items.map((item) => (
                    <li key={item.id} className="flex items-start gap-2">
                      <span className="mt-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[#1E3A8A]">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className={`mt-6 h-11 w-full rounded-full ${
                    plan.editable
                      ? "bg-[#0B3C89] text-white hover:bg-[#0A3271]"
                      : "bg-slate-200 text-slate-500 cursor-not-allowed"
                  }`}
                  onClick={() => handleOpenEdit(plan)}
                  disabled={!plan.editable}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
              </div>
            ))}
      </div>

      <section className="max-w-7xl rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Store Price Update History</h2>
            <p className="text-xs text-slate-500">
              Apple is updated first. Google Play updates after Apple confirms.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-full"
            onClick={() => refetchUpdateHistory()}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>

        <div className="mt-4 space-y-3">
          {isHistoryLoading ? (
            <Skeleton className="h-28 w-full" />
          ) : updateHistory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm text-slate-500">
              No coordinated price updates yet.
            </div>
          ) : (
            updateHistory.map((job) => (
              <div key={job._id} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(job.status)}`}>
                        {job.status}
                      </span>
                      <span className="text-sm font-semibold text-slate-900">
                        {job.target === "professional_plan" ? "Professional Plan" : `Exam Unlock (${job.apple.items?.length ?? 0} products)`}
                      </span>
                      <span className="text-sm text-slate-600">
                        ${Number(job.oldPrice).toFixed(2)} → ${Number(job.newPrice).toFixed(2)} USD
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {new Date(job.createdAt).toLocaleString()} · {job.initiatedBy?.name || job.initiatedBy?.email || "Admin"}
                      {job.retryCount ? ` · ${job.retryCount} retries` : ""}
                    </p>
                  </div>
                  {["failed", "partial"].includes(job.status) ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="rounded-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        disabled={isDeletingPriceUpdate || isRetryingPriceUpdate}
                        onClick={() => handleDeletePriceUpdate(job)}
                      >
                        <Trash2 className="mr-2 h-3.5 w-3.5" />
                        Delete
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        className="rounded-full bg-[#1E3A8A] text-white"
                        disabled={isRetryingPriceUpdate || isDeletingPriceUpdate}
                        onClick={() => retryPriceUpdate(job._id)}
                      >
                        <RefreshCw className="mr-2 h-3.5 w-3.5" />
                        Retry
                      </Button>
                    </div>
                  ) : null}
                </div>

                <div className="mt-3 grid gap-2 md:grid-cols-2">
                  {[
                    ["Apple App Store", job.apple],
                    ["Google Play", job.google],
                  ].map(([label, provider]) => {
                    const value = provider as StoreUpdateProvider;
                    return (
                      <div key={label as string} className={`rounded-lg border p-3 ${statusClass(value?.status || "pending")}`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold">{label as string}</span>
                          <span className="text-xs capitalize">{providerSummary(value)}</span>
                        </div>
                        {value?.error ? <p className="mt-1 text-xs">{value.error}</p> : null}
                        {(value?.items ?? []).some((item) => item.error) ? (
                          <details className="mt-2 text-xs">
                            <summary className="cursor-pointer font-medium">Product errors</summary>
                            <div className="mt-1 space-y-1">
                              {(value.items ?? [])
                                .filter((item) => item.error)
                                .map((item) => (
                                  <p key={`${item.productId}:${item.basePlanId || ""}`}>
                                    {item.productId}
                                    {item.basePlanId ? `:${item.basePlanId}` : ""}: {item.error}
                                  </p>
                                ))}
                            </div>
                          </details>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
                {job.lastError ? <p className="mt-2 text-xs text-red-600">Latest: {job.lastError}</p> : null}
              </div>
            ))
          )}
        </div>
      </section>

      <AddPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSuccess={() => {
          refetch();
          refetchUpdateHistory();
        }}
        planData={
          editingPlan
            ? {
                id: editingPlan.id,
                name: editingPlan.name,
                price: editingPlan.price,
                duration: mapDurationToSelect(editingPlan.duration),
                items: editingPlan.items,
                note: editingPlan.note,
                status: editingPlan.status,
              }
            : undefined
        }
        isEdit={Boolean(editingPlan)}
      />
      <ExamStoreProductsModal open={isExamProductsModalOpen} onOpenChange={setIsExamProductsModalOpen} />

      <AlertDialog
        open={Boolean(pendingDeleteJob)}
        onOpenChange={(open) => {
          if (!open && !isDeletingPriceUpdate) setPendingDeleteJob(null);
        }}
      >
        <AlertDialogContent className="rounded-2xl border-slate-200 bg-white">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">
              Delete failed update history?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-600">
              {pendingDeleteJob ? (
                <>
                  This will permanently remove the failed{" "}
                  <span className="font-semibold text-slate-800">
                    {pendingDeleteJob.target === "professional_plan"
                      ? "Professional Plan"
                      : "Exam Unlock"}
                  </span>{" "}
                  update from ${Number(pendingDeleteJob.oldPrice).toFixed(2)} to ${Number(pendingDeleteJob.newPrice).toFixed(2)}.
                </>
              ) : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={isDeletingPriceUpdate}
              className="rounded-full"
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeletingPriceUpdate || !pendingDeleteJob}
              onClick={(event) => {
                event.preventDefault();
                if (pendingDeleteJob) deletePriceUpdate(pendingDeleteJob._id);
              }}
              className="rounded-full bg-red-600 text-white hover:bg-red-700"
            >
              {isDeletingPriceUpdate ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog
        open={isExamPriceModalOpen}
        onOpenChange={setIsExamPriceModalOpen}
      >
        <DialogContent className="max-w-md rounded-2xl bg-white p-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Update Exam Unlock Price
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">
                Exam Unlock Price
              </label>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm font-semibold text-slate-500">$</span>
                <Input
                  type="number"
                  value={examUnlockPrice}
                  onChange={(e) => setExamUnlockPrice(e.target.value)}
                  className="h-10 rounded-lg border-slate-200"
                  min="0"
                  step="0.01"
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsExamPriceModalOpen(false)}
                className="h-10 rounded-full border-slate-300 px-6"
                disabled={isUpdatingExamPrice}
              >
                Cancel
              </Button>
              <Button
                className="h-10 rounded-full bg-[#1E3A8A] px-6 text-white hover:bg-[#1C357B]"
                onClick={() => updateExamPrice()}
                disabled={isUpdatingExamPrice}
              >
                {isUpdatingExamPrice ? "Starting..." : "Start Coordinated Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={isReferralCommissionModalOpen}
        onOpenChange={setIsReferralCommissionModalOpen}
      >
        <DialogContent className="max-w-md rounded-2xl bg-white p-6">
          <DialogHeader className="text-center">
            <DialogTitle className="text-lg font-semibold text-slate-900">
              Update Referral Commission
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-500">
                Commission Percent
              </label>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  type="number"
                  value={referralCommissionPercent}
                  onChange={(e) => setReferralCommissionPercent(e.target.value)}
                  className="h-10 rounded-lg border-slate-200"
                  min="0"
                  max="100"
                  step="0.01"
                />
                <span className="text-sm font-semibold text-slate-500">%</span>
              </div>
            </div>
            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsReferralCommissionModalOpen(false)}
                className="h-10 rounded-full border-slate-300 px-6"
                disabled={isUpdatingReferralCommission}
              >
                Cancel
              </Button>
              <Button
                className="h-10 rounded-full bg-[#1E3A8A] px-6 text-white hover:bg-[#1C357B]"
                onClick={() => updateReferralCommission()}
                disabled={isUpdatingReferralCommission}
              >
                {isUpdatingReferralCommission ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
