"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "react-query";
import { paymentAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { AddPlanModal } from "@/components/admin/subscriptions/plan-modal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Sparkles, Zap, Check, Pencil } from "lucide-react";

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
  if (value.includes("year")) return "Yearly";
  if (value.includes("quarter") || value.includes("3")) return "Quarterly";
  return "Monthly";
};

export default function SubscriptionsPage() {
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanCard | null>(null);
  const [isExamPriceModalOpen, setIsExamPriceModalOpen] = useState(false);
  const [examUnlockPrice, setExamUnlockPrice] = useState("");

  const { data: pricingData, isLoading, refetch } = useQuery(
    "pricing-settings",
    paymentAPI.getPricingSettings,
    { keepPreviousData: true }
  );

  const pricing = pricingData?.data?.data;
  const hideAddNewPlan = Number(pricing?.professionalPlanPrice) === 170;

  const { mutate: updateExamPrice, isLoading: isUpdatingExamPrice } =
    useMutation(
      async () => {
        const price = Number(examUnlockPrice);
        if (!Number.isFinite(price) || price <= 0) {
          throw new Error("Exam unlock price must be a positive number");
        }

        const proPrice = Number(pricing?.professionalPlanPrice ?? 180);
        const proIntervalCount = Number(
          pricing?.professionalPlanIntervalCount ?? 3
        );
        const proIntervalUnit = pricing?.professionalPlanIntervalUnit ?? "months";
        const proFeatures = Array.isArray(pricing?.professionalPlanFeatures)
          ? pricing.professionalPlanFeatures
          : defaultProFeatures;

        return paymentAPI.updatePricing({
          examUnlockPrice: price,
          professionalPlanPrice: Number.isFinite(proPrice) ? proPrice : 180,
          currency: pricing?.currency ?? "USD",
          professionalPlanIntervalCount: Number.isFinite(proIntervalCount)
            ? proIntervalCount
            : 3,
          professionalPlanIntervalUnit: proIntervalUnit,
          professionalPlanDescription:
            pricing?.professionalPlanDescription || "What's included in your plan",
          professionalPlanFeatures: proFeatures,
        });
      },
      {
        onSuccess: () => {
          toast.success("Exam unlock price updated");
          setIsExamPriceModalOpen(false);
          refetch();
        },
        onError: (error: any) => {
          toast.error(error?.message || "Failed to update exam unlock price");
        },
      }
    );

  const plans = useMemo<PlanCard[]>(() => {
    const proPrice = Number(pricing?.professionalPlanPrice ?? 180);
    const proIntervalCount = Number(pricing?.professionalPlanIntervalCount ?? 3);
    const proIntervalUnit = pricing?.professionalPlanIntervalUnit ?? "months";
    const proFeatures = Array.isArray(pricing?.professionalPlanFeatures)
      ? pricing.professionalPlanFeatures
      : defaultProFeatures;

    return [
      {
        id: "starter",
        name: "Starter Plan",
        price: 0,
        duration: "6 months",
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
          proIntervalUnit
        ),
        items: (proFeatures.length ? proFeatures : defaultProFeatures).map(
          (text: string, index: number) => ({
            id: `pro-${index}`,
            text,
          })
        ),
        note: pricing?.professionalPlanDescription || "What's included in your plan",
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

  return (
    <div className="min-h-screen bg-[#F5F8FF] p-4 md:p-6 space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">Flexible Plan</h1>
          <p className="text-sm text-slate-500">Create a plan that works best for you</p>
        </div>
        <Button
          className="h-10 rounded-full bg-[#1E3A8A] px-6 text-white hover:bg-[#1C357B]"
          onClick={handleOpenExamPrice}
        >
          <Plus className="mr-2 h-4 w-4" />
          Exam Unlock Price
        </Button>

        {plans.professionalPlanPrice > 0 && !hideAddNewPlan && (
          <Button
            className="h-10 rounded-full bg-[#1E3A8A] px-6 text-white hover:bg-[#1C357B]"
            onClick={handleOpenAdd}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add New Plan
          </Button>
        )}
        
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
                  <span className="text-sm text-slate-500">/{plan.duration}</span>
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

      <AddPlanModal
        isOpen={isPlanModalOpen}
        onClose={() => setIsPlanModalOpen(false)}
        onSuccess={refetch}
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
                {isUpdatingExamPrice ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
