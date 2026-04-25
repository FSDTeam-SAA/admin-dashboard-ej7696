"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { toast } from "sonner";
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
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { paymentAPI } from "@/lib/api";
import { AlertTriangle, Loader2, RotateCcw } from "lucide-react";

interface Transaction {
  _id: string;
  transactionType: "plan" | "resource";
  status: string;
  totalAmount?: number;
  finalPrice?: number;
  refundedAmount?: number;
  refundStatus?: "none" | "partial" | "full";
  refundHistory?: RefundEntry[];
  purchasedAt?: string;
  createdAt?: string;
  currency?: string;
  provider?: string;
  examId?: { name?: string } | null;
  productId?: { title?: string; productCode?: string } | null;
}

interface RefundEntry {
  _id?: string;
  refundedAt: string;
  amount: number;
  reason: string;
  type: "full" | "partial";
  stripeRefundId?: string;
  adminId?: { firstName?: string; lastName?: string; email?: string } | null;
}

interface RefundModalProps {
  isOpen: boolean;
  userId: string;
  userName?: string;
  onClose: () => void;
}

const getTransactionLabel = (tx: Transaction): string => {
  if (tx.transactionType === "plan") {
    const name = typeof tx.examId === "object" && tx.examId !== null ? tx.examId.name : null;
    return `Plan Purchase${name ? ` — ${name}` : ""}`;
  }
  const name =
    typeof tx.productId === "object" && tx.productId !== null
      ? tx.productId.title || tx.productId.productCode
      : null;
  return `Resource Purchase${name ? ` — ${name}` : ""}`;
};

const statusBadge = (tx: Transaction) => {
  const refundStatus = tx.refundStatus;
  const status = tx.status;
  if (refundStatus === "full" || status === "refunded") {
    return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Fully Refunded</Badge>;
  }
  if (refundStatus === "partial") {
    return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-100">Partially Refunded</Badge>;
  }
  if (status === "completed") {
    return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100">Completed</Badge>;
  }
  return <Badge className="bg-slate-100 text-slate-600 hover:bg-slate-100">{status ?? "—"}</Badge>;
};

const fmt = (value?: string | null) => {
  if (!value) return "N/A";
  const d = new Date(value);
  return isNaN(d.getTime()) ? "N/A" : d.toLocaleString();
};

const money = (amount: number, currency = "USD") =>
  `${currency} $${Number(amount).toFixed(2)}`;

export function RefundModal({ isOpen, userId, userName, onClose }: RefundModalProps) {
  const queryClient = useQueryClient();

  const [selectedTxId, setSelectedTxId] = useState("");
  const [refundType, setRefundType] = useState<"full" | "partial">("full");
  const [partialAmount, setPartialAmount] = useState("");
  const [reason, setReason] = useState("");
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const { data: txData, isLoading } = useQuery(
    ["user-transactions", userId],
    () => paymentAPI.getUserTransactions(userId),
    {
      enabled: isOpen && Boolean(userId),
      staleTime: 0,
      select: (res) => res.data?.data as Transaction[],
      onError: () => toast.error("Failed to load transactions"),
    }
  );

  const transactions: Transaction[] = txData ?? [];
  const selectedTx = transactions.find((tx) => tx._id === selectedTxId) ?? null;

  const paidAmount = selectedTx ? (selectedTx.totalAmount ?? selectedTx.finalPrice ?? 0) : 0;
  const alreadyRefunded = selectedTx?.refundedAmount ?? 0;
  const refundable = paidAmount - alreadyRefunded;
  const currency = selectedTx?.currency ?? "USD";

  const resolvedAmount = refundType === "full" ? refundable : Number(partialAmount) || 0;
  const exceedsRefundable = refundType === "partial" && resolvedAmount > 0 && resolvedAmount > refundable;

  const canSubmit =
    Boolean(selectedTx) &&
    reason.trim().length > 0 &&
    refundable > 0 &&
    resolvedAmount > 0 &&
    !exceedsRefundable;

  const { mutate: submitRefund, isLoading: isSubmitting } = useMutation(
    () =>
      paymentAPI.processRefund(selectedTxId, {
        type: refundType,
        amount: refundType === "partial" ? resolvedAmount : undefined,
        reason: reason.trim(),
        transactionType: selectedTx!.transactionType,
      }),
    {
      onSuccess: () => {
        toast.success(`Refund of ${money(resolvedAmount, currency)} processed`);
        queryClient.invalidateQueries(["user-transactions", userId]);
        queryClient.invalidateQueries(["admin-user-details", userId]);
        setIsConfirmOpen(false);
        setSelectedTxId("");
        setRefundType("full");
        setPartialAmount("");
        setReason("");
      },
      onError: (err: any) => {
        toast.error(err?.response?.data?.message || "Failed to process refund");
        setIsConfirmOpen(false);
      },
    }
  );

  const handleClose = () => {
    setSelectedTxId("");
    setRefundType("full");
    setPartialAmount("");
    setReason("");
    setIsConfirmOpen(false);
    onClose();
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent
          className="w-full sm:max-w-4xl flex flex-col"
          style={{
            maxHeight: "85vh",
            background:
              "linear-gradient(180deg, #FFFFFF 0%, #E5EEFF 20.91%, #EDF3FF 41.83%, #DEE9FF 69.71%, #FFFFFF 100%)",
          }}
        >
          <DialogHeader className="shrink-0">
            <DialogTitle className="flex items-center gap-2 text-[#1E3A8A]">
              <RotateCcw className="h-4 w-4" />
              Process Refund
              {userName && (
                <span className="font-normal text-slate-500 text-sm ml-1">— {userName}</span>
              )}
            </DialogTitle>
          </DialogHeader>

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto space-y-5 pr-1">
            {/* Select Transaction */}
            <div className="space-y-2">
              <Label className="font-semibold">Select Transaction</Label>
              {isLoading ? (
                <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading transactions...
                </div>
              ) : transactions.length === 0 ? (
                <p className="text-sm text-slate-500">No transactions found for this user.</p>
              ) : (
                <Select
                  value={selectedTxId}
                  onValueChange={(v) => {
                    setSelectedTxId(v);
                    setRefundType("full");
                    setPartialAmount("");
                  }}
                >
                  <SelectTrigger className="bg-white w-full">
                    <SelectValue placeholder="Choose a transaction..." />
                  </SelectTrigger>
                  <SelectContent className="bg-white max-w-xl">
                    {transactions.map((tx) => {
                      const paid = tx.totalAmount ?? tx.finalPrice ?? 0;
                      const refunded = tx.refundedAmount ?? 0;
                      const remaining = paid - refunded;
                      const fullyRefunded = tx.refundStatus === "full" || tx.status === "refunded";
                      return (
                        <SelectItem
                          key={tx._id}
                          value={tx._id}
                          disabled={fullyRefunded || remaining <= 0}
                          className="max-w-xl"
                        >
                          <span className="block truncate max-w-md">
                            {getTransactionLabel(tx)} — {money(paid, tx.currency)}
                            {fullyRefunded
                              ? " (fully refunded)"
                              : refunded > 0
                              ? ` (${money(refunded, tx.currency)} refunded)`
                              : ""}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Transaction Summary */}
            {selectedTx && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-slate-700">Transaction Summary</p>
                  {statusBadge(selectedTx)}
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Total Paid</p>
                    <p className="font-semibold text-slate-800">{money(paidAmount, currency)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Already Refunded</p>
                    <p className="font-semibold text-amber-600">
                      {alreadyRefunded > 0 ? money(alreadyRefunded, currency) : "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Provider</p>
                    <p className="font-semibold text-slate-800 uppercase">
                      {selectedTx.provider ?? "—"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 mb-0.5">Purchased</p>
                    <p className="font-semibold text-slate-800 text-xs">
                      {fmt(selectedTx.purchasedAt ?? selectedTx.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-700">Remaining Refundable</p>
                  <p className="text-lg font-bold text-emerald-600">{money(refundable, currency)}</p>
                </div>
              </div>
            )}

            {/* Fully refunded notice */}
            {selectedTx && refundable <= 0 && (
              <div className="flex items-center gap-3 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
                <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                <p className="text-sm text-slate-600">This transaction has been fully refunded.</p>
              </div>
            )}

            {/* Refund Type */}
            {selectedTx && refundable > 0 && (
              <div className="space-y-3">
                <Label className="font-semibold">Refund Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <label
                    className={`flex items-start gap-3 cursor-pointer rounded-xl border p-4 transition-colors ${
                      refundType === "full"
                        ? "border-[#1E3A8A] bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="refundType"
                      value="full"
                      checked={refundType === "full"}
                      onChange={() => {
                        setRefundType("full");
                        setPartialAmount("");
                      }}
                      className="mt-0.5 accent-[#1E3A8A]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Full Refund</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {money(refundable, currency)}
                      </p>
                    </div>
                  </label>
                  <label
                    className={`flex items-start gap-3 cursor-pointer rounded-xl border p-4 transition-colors ${
                      refundType === "partial"
                        ? "border-[#1E3A8A] bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="refundType"
                      value="partial"
                      checked={refundType === "partial"}
                      onChange={() => setRefundType("partial")}
                      className="mt-0.5 accent-[#1E3A8A]"
                    />
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Partial Refund</p>
                      <p className="text-xs text-slate-500 mt-0.5">Custom amount</p>
                    </div>
                  </label>
                </div>

                {refundType === "partial" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="partial-amount" className="text-sm">
                      Refund Amount ({currency})
                    </Label>
                    <Input
                      id="partial-amount"
                      type="number"
                      min={0.01}
                      step={0.01}
                      placeholder={`Max ${refundable.toFixed(2)}`}
                      value={partialAmount}
                      onChange={(e) => setPartialAmount(e.target.value)}
                      className="bg-white"
                    />
                    {exceedsRefundable && (
                      <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <p className="text-xs text-amber-700">
                          Amount exceeds the remaining refundable balance of{" "}
                          <strong>{money(refundable, currency)}</strong>.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Reason */}
            {selectedTx && refundable > 0 && (
              <div className="space-y-1.5">
                <Label htmlFor="refund-reason" className="font-semibold">
                  Reason <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="refund-reason"
                  placeholder="Enter refund reason..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  className="resize-none bg-white"
                />
              </div>
            )}

            {/* Refund History */}
            {selectedTx &&
              Array.isArray(selectedTx.refundHistory) &&
              selectedTx.refundHistory.length > 0 && (
                <div className="space-y-2">
                  <Label className="font-semibold">Refund History</Label>
                  <div className="space-y-2">
                    {selectedTx.refundHistory.map((entry, idx) => (
                      <div
                        key={entry._id ?? idx}
                        className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-slate-800">
                            {money(entry.amount, currency)}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">{fmt(entry.refundedAt)}</p>
                          {entry.reason && (
                            <p className="text-xs text-slate-500 mt-0.5">"{entry.reason}"</p>
                          )}
                          {entry.stripeRefundId && (
                            <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                              Stripe: {entry.stripeRefundId}
                            </p>
                          )}
                        </div>
                        <Badge
                          className={
                            entry.type === "full"
                              ? "bg-red-100 text-red-700 hover:bg-red-100"
                              : "bg-amber-100 text-amber-800 hover:bg-amber-100"
                          }
                        >
                          {entry.type === "full" ? "Full" : "Partial"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

          </div>

          {/* Fixed footer — always visible */}
          <div className="shrink-0 flex items-center justify-between pt-4 mt-2 border-t border-slate-200 bg-white/60 backdrop-blur-sm rounded-b-lg px-1">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              className="bg-[#1E3A8A] hover:bg-[#152a61] text-white px-6"
              disabled={!canSubmit || isSubmitting}
              onClick={() => setIsConfirmOpen(true)}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Process Refund"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <AlertDialogContent className="bg-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Refund</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm text-slate-600">
                <p>You are about to process the following refund:</p>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Transaction</span>
                    <span className="font-medium text-slate-800 text-right max-w-50 truncate">
                      {selectedTx ? getTransactionLabel(selectedTx) : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Refund Amount</span>
                    <span className="font-bold text-[#1E3A8A]">{money(resolvedAmount, currency)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Type</span>
                    <span className="capitalize font-medium text-slate-800">{refundType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reason</span>
                    <span className="font-medium text-slate-800 text-right max-w-50">{reason}</span>
                  </div>
                </div>
                <p className="text-amber-700 text-xs font-medium">
                  ⚠ This action cannot be undone.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex justify-end gap-3 mt-2">
            <AlertDialogCancel className="rounded-lg" disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => submitRefund()}
              disabled={isSubmitting}
              className="rounded-lg bg-[#1E3A8A] text-white hover:bg-[#152a61]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Refund"
              )}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
