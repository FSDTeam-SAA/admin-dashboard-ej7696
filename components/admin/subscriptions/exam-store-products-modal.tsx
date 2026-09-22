"use client";

import { useEffect, useState } from "react";
import { useQuery } from "react-query";
import { examAPI, paymentAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";

type Products = {
  appleProductId: string;
  googleProductId: string;
  googleBasePlanId: string;
  revenueCatAppleProductId: string;
  revenueCatGoogleProductId: string;
};

const empty: Products = {
  appleProductId: "",
  googleProductId: "",
  googleBasePlanId: "",
  revenueCatAppleProductId: "",
  revenueCatGoogleProductId: "",
};

const fields: { key: keyof Products; label: string; placeholder: string }[] = [
  { key: "appleProductId", label: "Apple App Store product ID", placeholder: "com.example.exam.new.onemonth" },
  { key: "googleProductId", label: "Google Play subscription ID", placeholder: "com.example.exam.new.sixmonth" },
  { key: "googleBasePlanId", label: "Google Play base plan ID", placeholder: "newonemonth" },
  { key: "revenueCatAppleProductId", label: "RevenueCat Apple product ID", placeholder: "Same as the Apple store product ID" },
  { key: "revenueCatGoogleProductId", label: "RevenueCat Google product ID", placeholder: "subscription_id:base_plan_id" },
];

export function ExamStoreProductsModal({ open, onOpenChange }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [examId, setExamId] = useState("");
  const [products, setProducts] = useState<Products>(empty);
  const [saving, setSaving] = useState(false);
  const { data, isLoading, refetch } = useQuery(
    "exam-store-product-options",
    () => examAPI.listAllExams(1, 1000),
    { enabled: open },
  );
  const exams: any[] = data?.data?.data?.exams ?? [];
  const selected = exams.find((exam) => exam._id === examId);

  useEffect(() => {
    setProducts(selected?.storeProducts ? {
      appleProductId: selected.storeProducts.appleProductId || "",
      googleProductId: selected.storeProducts.googleProductId || "",
      googleBasePlanId: selected.storeProducts.googleBasePlanId || "",
      revenueCatAppleProductId: selected.storeProducts.revenueCatAppleProductId || "",
      revenueCatGoogleProductId: selected.storeProducts.revenueCatGoogleProductId || "",
    } : empty);
  }, [examId, data]);

  const save = async () => {
    if (!examId || Object.values(products).some((value) => !value.trim())) {
      toast.error("Choose an exam and enter all five product IDs");
      return;
    }
    setSaving(true);
    try {
      await paymentAPI.saveExamStoreProducts(examId, products);
      toast.success("Exam store products saved");
      await refetch();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Could not save exam products");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto rounded-2xl bg-white p-6">
        <DialogHeader><DialogTitle>Add Exam Store Products</DialogTitle></DialogHeader>
        <p className="text-sm text-slate-600">Create the products in Apple, Google Play, and RevenueCat first. Enter their exact IDs here. The next coordinated price update will include this exam.</p>
        <label className="space-y-2 text-sm font-medium text-slate-700">
          <span>Exam</span>
          <select value={examId} onChange={(event) => setExamId(event.target.value)} disabled={isLoading || saving}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3">
            <option value="">Select an exam</option>
            {exams.map((exam) => <option key={exam._id} value={exam._id}>{exam.name}</option>)}
          </select>
        </label>
        {fields.map(({ key, label, placeholder }) => (
          <label key={key} className="space-y-2 text-sm font-medium text-slate-700">
            <span>{label}</span>
            <Input value={products[key]} placeholder={placeholder} disabled={saving}
              onChange={(event) => setProducts((current) => {
                const next = { ...current, [key]: event.target.value };
                if (key === "appleProductId" && (!current.revenueCatAppleProductId || current.revenueCatAppleProductId === current.appleProductId)) {
                  next.revenueCatAppleProductId = event.target.value;
                }
                if ((key === "googleProductId" || key === "googleBasePlanId") &&
                    (!current.revenueCatGoogleProductId || current.revenueCatGoogleProductId === `${current.googleProductId}:${current.googleBasePlanId}`)) {
                  next.revenueCatGoogleProductId = next.googleProductId && next.googleBasePlanId
                    ? `${next.googleProductId}:${next.googleBasePlanId}` : "";
                }
                return next;
              })} />
          </label>
        ))}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancel</Button>
          <Button type="button" className="bg-[#1E3A8A] text-white" onClick={save} disabled={saving || !examId}>
            {saving ? "Saving..." : "Save Product IDs"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
