"use client";

import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { resourceAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RefreshCw } from "lucide-react";

export default function PurchaseAdminPage() {
  const [page, setPage] = useState(1);
  const limit = 10;

  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [productCodeFilter, setProductCodeFilter] = useState("");

  const {
    data: purchasesRes,
    isLoading,
    refetch,
  } = useQuery(["resource-purchases-admin", page, statusFilter, typeFilter, productCodeFilter], () =>
    resourceAPI.listPurchases(page, limit, {
      status: statusFilter || undefined,
      purchaseType: typeFilter || undefined,
      productCode: productCodeFilter.trim() || undefined,
    })
  );

  const payload = purchasesRes?.data?.data || {};
  const purchases = payload?.purchases || [];
  const meta = payload?.meta || { page: 1, totalPages: 1, total: 0 };

  const completedCount = useMemo(
    () => purchases.filter((item: any) => item?.status === "completed").length,
    [purchases]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Resource Purchases</h1>
          <p className="text-gray-500 mt-1 text-sm">Track all eBook purchase transactions.</p>
        </div>
        <Button variant="outline" onClick={() => refetch()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <p className="text-sm text-slate-500">Total Purchases</p>
          <p className="text-2xl font-bold text-slate-900">{meta.total || 0}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Completed (This Page)</p>
          <p className="text-2xl font-bold text-slate-900">{completedCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-slate-500">Current Page</p>
          <p className="text-2xl font-bold text-slate-900">
            {meta.page || 1} / {meta.totalPages || 1}
          </p>
        </Card>
      </div>

      <Card className="p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Status</p>
            <select
              className="w-full h-10 border border-slate-200 rounded-md px-3 text-sm"
              value={statusFilter}
              onChange={(e) => {
                setPage(1);
                setStatusFilter(e.target.value);
              }}
            >
              <option value="">All</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Purchase Type</p>
            <select
              className="w-full h-10 border border-slate-200 rounded-md px-3 text-sm"
              value={typeFilter}
              onChange={(e) => {
                setPage(1);
                setTypeFilter(e.target.value);
              }}
            >
              <option value="">All</option>
              <option value="single">Single</option>
              <option value="bundle">Bundle</option>
              <option value="professional_upgrade_addon">Upgrade Add-On</option>
            </select>
          </div>
          <div className="space-y-1 md:col-span-2">
            <p className="text-xs text-slate-500">Product Code</p>
            <Input
              value={productCodeFilter}
              placeholder="api510_inspection_guide"
              onChange={(e) => {
                setPage(1);
                setProductCodeFilter(e.target.value);
              }}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-2">User</th>
                <th className="text-left py-2">Product</th>
                <th className="text-left py-2">Code</th>
                <th className="text-left py-2">Type</th>
                <th className="text-left py-2">Provider</th>
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Amount</th>
                <th className="text-left py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {(isLoading ? [] : purchases).map((purchase: any) => (
                <tr key={purchase._id} className="border-b border-slate-100">
                  <td className="py-2">
                    {purchase.userId?.email ||
                      purchase.userId?.name ||
                      [purchase.userId?.firstName, purchase.userId?.lastName]
                        .filter(Boolean)
                        .join(" ") ||
                      "-"}
                  </td>
                  <td className="py-2">{purchase.productId?.title || "-"}</td>
                  <td className="py-2">{purchase.productCode || "-"}</td>
                  <td className="py-2">{purchase.purchaseType || "-"}</td>
                  <td className="py-2">{purchase.provider || "-"}</td>
                  <td className="py-2">{purchase.status || "-"}</td>
                  <td className="py-2">${Number(purchase.finalPrice || 0).toFixed(2)}</td>
                  <td className="py-2">
                    {purchase.createdAt ? new Date(purchase.createdAt).toLocaleDateString() : "-"}
                  </td>
                </tr>
              ))}
              {isLoading && (
                <tr>
                  <td colSpan={8} className="py-4 text-slate-500">
                    Loading purchase ledger...
                  </td>
                </tr>
              )}
              {!isLoading && purchases.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-slate-500">
                    No purchases found.
                  </td>
                </tr>
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
