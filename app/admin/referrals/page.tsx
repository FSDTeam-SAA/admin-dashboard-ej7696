"use client";

import { useState } from "react";
import { useMutation, useQuery } from "react-query";
import { referralAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

export default function ReferralsAdminPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;

  const {
    data: overviewRes,
    isLoading: loadingOverview,
    refetch: refetchOverview,
  } = useQuery(["referral-overview"], () => referralAPI.getOverview());

  const {
    data: payoutRes,
    isLoading: loadingPayouts,
    refetch: refetchPayouts,
  } = useQuery(["referral-payouts", page, statusFilter], () =>
    referralAPI.listPayoutRequests(page, limit, statusFilter || undefined)
  );

  const overview = overviewRes?.data?.data || {};
  const payload = payoutRes?.data?.data || {};
  const requests = payload?.requests || [];
  const meta = payload?.meta || { page: 1, totalPages: 1, total: 0 };

  const updatePayoutMutation = useMutation(
    ({ requestId, status }: { requestId: string; status: "approved" | "rejected" | "paid" }) =>
      referralAPI.updatePayoutRequestStatus(requestId, {
        status,
        notes: `Updated from admin dashboard: ${status}`,
      }),
    {
      onSuccess: () => {
        toast.success("Payout request updated");
        refetchPayouts();
        refetchOverview();
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to update payout request");
      },
    }
  );

  const reloadAll = async () => {
    await Promise.all([refetchOverview(), refetchPayouts()]);
  };

  const formatMoney = (value: number) => `$${Number(value || 0).toFixed(2)}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Referral & Payouts</h1>
          <p className="text-gray-500 mt-1 text-sm">Track referral health and process payout requests.</p>
        </div>
        <Button variant="outline" onClick={reloadAll} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Relationships</p>
          <p className="text-2xl font-bold text-slate-900">{loadingOverview ? "..." : overview.totalRelationships || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Active</p>
          <p className="text-2xl font-bold text-slate-900">{loadingOverview ? "..." : overview.activeRelationships || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Disqualified</p>
          <p className="text-2xl font-bold text-slate-900">{loadingOverview ? "..." : overview.disqualifiedRelationships || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Pending Rewards</p>
          <p className="text-2xl font-bold text-slate-900">{loadingOverview ? "..." : formatMoney(overview.pendingRewards || 0)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Available Rewards</p>
          <p className="text-2xl font-bold text-slate-900">{loadingOverview ? "..." : formatMoney(overview.availableRewards || 0)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Pending Cash Payout</p>
          <p className="text-2xl font-bold text-slate-900">{loadingOverview ? "..." : formatMoney(overview.payoutPendingAmount || 0)}</p>
        </Card>
      </div>

      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Payout Requests</h2>
          <div className="flex items-center gap-2">
            <label className="text-sm text-slate-600">Status</label>
            <select
              className="h-9 border border-slate-200 rounded-md px-3 text-sm"
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="paid">Paid</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2">User</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Requested</th>
                <th className="text-left py-2">Processed By</th>
                <th className="text-left py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {(loadingPayouts ? [] : requests).map((request: any) => {
                const userName =
                  request?.userId?.name ||
                  [request?.userId?.firstName, request?.userId?.lastName].filter(Boolean).join(" ") ||
                  request?.userId?.email ||
                  "Unknown";

                const canApprove = request.status === "pending";
                const canReject = request.status === "pending";
                const canMarkPaid = request.status === "pending" || request.status === "approved";

                return (
                  <tr key={request._id} className="border-b border-slate-100">
                    <td className="py-2">
                      <div className="flex flex-col">
                        <span>{userName}</span>
                        <span className="text-xs text-slate-500">{request?.userId?.email || ""}</span>
                      </div>
                    </td>
                    <td className="py-2">{formatMoney(request.amount || 0)}</td>
                    <td className="py-2">
                      <span className="px-2 py-1 rounded text-xs bg-slate-100 text-slate-700 uppercase">
                        {request.status}
                      </span>
                    </td>
                    <td className="py-2">
                      {request.requestedAt
                        ? new Date(request.requestedAt).toLocaleDateString()
                        : "-"}
                    </td>
                    <td className="py-2">{request?.processedBy?.email || "-"}</td>
                    <td className="py-2">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canApprove || updatePayoutMutation.isLoading}
                          onClick={() =>
                            updatePayoutMutation.mutate({ requestId: request._id, status: "approved" })
                          }
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={!canReject || updatePayoutMutation.isLoading}
                          onClick={() =>
                            updatePayoutMutation.mutate({ requestId: request._id, status: "rejected" })
                          }
                        >
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          disabled={!canMarkPaid || updatePayoutMutation.isLoading}
                          onClick={() =>
                            updatePayoutMutation.mutate({ requestId: request._id, status: "paid" })
                          }
                        >
                          Mark Paid
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {loadingPayouts && (
                <tr>
                  <td colSpan={6} className="py-4 text-slate-500">
                    Loading payout requests...
                  </td>
                </tr>
              )}

              {!loadingPayouts && requests.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    No payout requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {meta.page || 1} of {meta.totalPages || 1} ({meta.total || 0} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(meta.page || 1) <= 1}
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(meta.page || 1) >= (meta.totalPages || 1)}
              onClick={() => setPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
