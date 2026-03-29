"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "react-query";
import { referralAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

type ReferralListType = "shared" | "used";
type ReferralSection = "shared" | "used" | "payouts";
type PayoutFilterStatus = "all" | "pending" | "approved" | "rejected" | "paid";
type PayoutStatusUpdate = "approved" | "rejected" | "paid";

const formatMoney = (value: number) => `$${Number(value || 0).toFixed(2)}`;
const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

const resolveUserName = (user: any) => {
  if (!user) return "Unknown";
  return (
    user.name ||
    [user.firstName, user.lastName].filter(Boolean).join(" ") ||
    user.email ||
    "Unknown"
  );
};

const isFinalizedPayoutStatus = (status: string) =>
  ["rejected", "paid"].includes((status || "").toLowerCase());

export default function ReferralsAdminPage() {
  const queryClient = useQueryClient();
  const [listType, setListType] = useState<ReferralListType>("shared");
  const [activeSection, setActiveSection] = useState<ReferralSection>("shared");
  const [page, setPage] = useState(1);
  const [payoutPage, setPayoutPage] = useState(1);
  const [payoutStatus, setPayoutStatus] = useState<PayoutFilterStatus>("all");
  const [activeRequestId, setActiveRequestId] = useState("");
  const limit = 10;

  const {
    data: overviewRes,
    isLoading: loadingOverview,
    refetch: refetchOverview,
  } = useQuery(["referral-overview"], () => referralAPI.getOverview());

  const {
    data: listRes,
    isLoading: loadingList,
    refetch: refetchList,
  } = useQuery(["referral-admin-list", listType, page], () =>
    referralAPI.listAdminRelationships(page, limit, listType),
    {
      enabled: activeSection !== "payouts",
      keepPreviousData: true,
    }
  );

  const {
    data: payoutRes,
    isLoading: loadingPayouts,
    refetch: refetchPayouts,
  } = useQuery(["referral-admin-payouts", payoutPage, payoutStatus], () =>
    referralAPI.listPayoutRequests(
      payoutPage,
      limit,
      payoutStatus === "all" ? undefined : payoutStatus
    ),
    {
      enabled: activeSection === "payouts",
      keepPreviousData: true,
    }
  );

  const payoutMutation = useMutation(
    async ({
      requestId,
      status,
    }: {
      requestId: string;
      status: PayoutStatusUpdate;
    }) => referralAPI.updatePayoutRequestStatus(requestId, { status }),
    {
      onSuccess: () => {
        toast.success("Payout request updated");
        queryClient.invalidateQueries(["referral-admin-payouts"]);
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Failed to update payout request");
      },
      onSettled: () => {
        setActiveRequestId("");
      },
    }
  );

  const overview = overviewRes?.data?.data || {};
  const payload = listRes?.data?.data || {};
  const items = payload?.items || [];
  const meta = payload?.meta || { page: 1, totalPages: 1, total: 0 };
  const payoutPayload = payoutRes?.data?.data || {};
  const payoutItems = payoutPayload?.requests || [];
  const payoutMeta = payoutPayload?.meta || { page: 1, totalPages: 1, total: 0 };

  const reloadAll = async () => {
    const jobs = [refetchOverview()];
    if (activeSection === "payouts") {
      jobs.push(refetchPayouts());
    } else {
      jobs.push(refetchList());
    }
    await Promise.all(jobs);
  };

  const switchList = (nextType: ReferralListType) => {
    setPage(1);
    setListType(nextType);
    setActiveSection(nextType);
  };

  const updatePayoutStatus = async (requestId: string, status: PayoutStatusUpdate) => {
    setActiveRequestId(requestId);
    await payoutMutation.mutateAsync({ requestId, status });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Referral &amp; Payouts</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Completed referral conversion summary (payment-success only).
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total Shared Referrals</p>
          <p className="text-2xl font-bold text-slate-900">
            {loadingOverview ? "..." : overview.totalSharedReferrals || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total Used Referrals</p>
          <p className="text-2xl font-bold text-slate-900">
            {loadingOverview ? "..." : overview.totalUsedReferrals || 0}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total Earnings</p>
          <p className="text-2xl font-bold text-slate-900">
            {loadingOverview ? "..." : formatMoney(overview.totalEarnings || 0)}
          </p>
        </Card>
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          className={ 
            activeSection === "shared"
              ? "!bg-[#1E3A8A] !text-white !border-[#1E3A8A] p-2 rounded-md"
              : "!bg-gray-200 !text-[#1E3A8A] !border-[#1E3A8A] hover:!bg-[#E5EEFF] p-2 rounded-md"
          }
          onClick={() => switchList("shared")}
        >
          Total Shared Referrals
        </button>
        <button
          type="button"
          className={
            activeSection === "used"
              ? "!bg-[#1E3A8A] !text-white !border-[#1E3A8A] p-2 rounded-md"
              : "!bg-gray-200 !text-[#1E3A8A] !border-[#1E3A8A] hover:!bg-[#E5EEFF] p-2 rounded-md"
          }
          onClick={() => switchList("used")}
        >
          Total Used Referrals
        </button>
        <button
          type="button"
          className={
            activeSection === "payouts"
              ? "!bg-[#1E3A8A] !text-white !border-[#1E3A8A] p-2 rounded-md"
              : "!bg-gray-200 !text-[#1E3A8A] !border-[#1E3A8A] hover:!bg-[#E5EEFF] p-2 rounded-md"
          }
          onClick={() => setActiveSection("payouts")}
        >
          Payout Requests
        </button>
      </div>

      {activeSection !== "payouts" && (
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {listType === "shared" ? "Shared Referral Users" : "Used Referral Users"}
          </h2>
          <p className="text-xs text-slate-500">{meta.total || 0} total</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2">Referred User</th>
                <th className="text-left py-2">Referrer</th>
                <th className="text-left py-2">Referral Code</th>
                <th className="text-left py-2">Joined</th>
                <th className="text-left py-2">Used</th>
                <th className="text-left py-2">Earnings</th>
              </tr>
            </thead>
            <tbody>
              {loadingList ? (
                <tr>
                  <td colSpan={6} className="py-4 text-slate-500">
                    Loading referral users...
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-slate-500">
                    {listType === "shared"
                      ? "No shared referrals found."
                      : "No used referrals found."}
                  </td>
                </tr>
              ) : (
                items.map((item: any) => (
                  <tr key={item.relationshipId} className="border-b border-slate-100">
                    <td className="py-2">
                      <div className="flex flex-col">
                        <span>{item?.referred?.name || "Unknown"}</span>
                        <span className="text-xs text-slate-500">{item?.referred?.email || ""}</span>
                      </div>
                    </td>
                    <td className="py-2">
                      <div className="flex flex-col">
                        <span>{item?.referrer?.name || "Unknown"}</span>
                        <span className="text-xs text-slate-500">{item?.referrer?.email || ""}</span>
                      </div>
                    </td>
                    <td className="py-2">{item.referralCode || "-"}</td>
                    <td className="py-2">{formatDate(item.joinedAt)}</td>
                    <td className="py-2">{formatDate(item.usedAt)}</td>
                    <td className="py-2">{formatMoney(item.totalEarnings || 0)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {meta.page || 1} of {meta.totalPages || 1}
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
      )}

      {activeSection === "payouts" && (
      <Card className="p-5 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-slate-900">Payout Requests</h2>
          <div className="flex items-center gap-2">
            <select
              className="h-9 border border-slate-200 rounded-md px-2 text-sm"
              value={payoutStatus}
              onChange={(event) => {
                setPayoutPage(1);
                setPayoutStatus(event.target.value as PayoutFilterStatus);
              }}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
              <option value="paid">Paid</option>
            </select>
            <p className="text-xs text-slate-500">{payoutMeta.total || 0} total</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2">User</th>
                <th className="text-left py-2">Referral Code</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Requested</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Processed</th>
                <th className="text-left py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loadingPayouts ? (
                <tr>
                  <td colSpan={7} className="py-4 text-slate-500">
                    Loading payout requests...
                  </td>
                </tr>
              ) : payoutItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-6 text-center text-slate-500">
                    No payout requests found.
                  </td>
                </tr>
              ) : (
                payoutItems.map((item: any) => {
                  const user = item?.userId || null;
                  const status = item?.status || "pending";
                  const finalized = isFinalizedPayoutStatus(status);
                  const isActing = payoutMutation.isLoading && activeRequestId === item?._id;

                  return (
                    <tr key={item?._id} className="border-b border-slate-100">
                      <td className="py-2">
                        <div className="flex flex-col">
                          <span>{resolveUserName(user)}</span>
                          <span className="text-xs text-slate-500">{user?.email || ""}</span>
                        </div>
                      </td>
                      <td className="py-2">{user?.referralCode || "-"}</td>
                      <td className="py-2">{formatMoney(item?.amount || 0)}</td>
                      <td className="py-2">{formatDate(item?.requestedAt || item?.createdAt)}</td>
                      <td className="py-2 capitalize">{status}</td>
                      <td className="py-2">{formatDate(item?.processedAt)}</td>
                      <td className="py-2">
                        {finalized ? (
                          <span className="text-xs text-slate-500">Finalized</span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isActing}
                              onClick={() => updatePayoutStatus(item._id, "paid")}
                            >
                              Done
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={isActing}
                              onClick={() => updatePayoutStatus(item._id, "rejected")}
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-xs text-slate-500">
            Page {payoutMeta.page || 1} of {payoutMeta.totalPages || 1}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={(payoutMeta.page || 1) <= 1}
              onClick={() => setPayoutPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={(payoutMeta.page || 1) >= (payoutMeta.totalPages || 1)}
              onClick={() => setPayoutPage((prev) => prev + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>
      )}
    </div>
  );
}
