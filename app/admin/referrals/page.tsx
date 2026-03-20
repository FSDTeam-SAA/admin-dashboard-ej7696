"use client";

import { useState } from "react";
import { useQuery } from "react-query";
import { referralAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ReferralListType = "shared" | "used";

const formatMoney = (value: number) => `$${Number(value || 0).toFixed(2)}`;
const formatDate = (value?: string | Date | null) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString();
};

export default function ReferralsAdminPage() {
  const [listType, setListType] = useState<ReferralListType>("shared");
  const [page, setPage] = useState(1);
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
    referralAPI.listAdminRelationships(page, limit, listType)
  );

  const overview = overviewRes?.data?.data || {};
  const payload = listRes?.data?.data || {};
  const items = payload?.items || [];
  const meta = payload?.meta || { page: 1, totalPages: 1, total: 0 };

  const reloadAll = async () => {
    await Promise.all([refetchOverview(), refetchList()]);
  };

  const switchList = (nextType: ReferralListType) => {
    setPage(1);
    setListType(nextType);
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
            listType === "shared"
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
            listType === "used"
              ? "!bg-[#1E3A8A] !text-white !border-[#1E3A8A] p-2 rounded-md"
              : "!bg-gray-200 !text-[#1E3A8A] !border-[#1E3A8A] hover:!bg-[#E5EEFF] p-2 rounded-md"
          }
          onClick={() => switchList("used")}
        >
          Total Used Referrals
        </button>
      </div>

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
    </div>
  );
}
