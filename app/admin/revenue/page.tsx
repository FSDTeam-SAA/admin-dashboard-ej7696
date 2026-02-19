"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "react-query";
import { paymentAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight, Search, Trash2 } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Range = "day" | "week" | "month";

const formatShortDate = (dateStr: string) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
};

const getISOWeekKey = (dateStr: string) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  const target = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNr = (target.getUTCDay() + 6) % 7;
  target.setUTCDate(target.getUTCDate() - dayNr + 3);
  const firstThursday = new Date(Date.UTC(target.getUTCFullYear(), 0, 4));
  const firstDayNr = (firstThursday.getUTCDay() + 6) % 7;
  firstThursday.setUTCDate(firstThursday.getUTCDate() - firstDayNr + 3);
  const weekNo =
    1 +
    Math.round(
      (target.getTime() - firstThursday.getTime()) / (7 * 24 * 3600 * 1000)
    );

  return `${target.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
};

const getMonthKey = (dateStr: string) => {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
};

const aggregateRevenue = (
  rows: Array<{ date: string; revenue: number }>,
  mode: Range
) => {
  if (mode === "day") {
    return rows.map((r) => ({
      label: formatShortDate(r.date),
      value: r.revenue ?? 0,
    }));
  }

  const map = new Map<string, { label: string; value: number }>();
  rows.forEach((r) => {
    const key = mode === "week" ? getISOWeekKey(r.date) : getMonthKey(r.date);
    const prev = map.get(key) || { label: key, value: 0 };
    prev.value += r.revenue ?? 0;
    map.set(key, prev);
  });

  return Array.from(map.values()).sort((a, b) =>
    a.label.localeCompare(b.label)
  );
};

export default function RevenuePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [range, setRange] = useState<Range>("day");
  const pageSize = 8;

  // API Queries (Logic remains the same)
  const { data: summaryData, isLoading: isSummaryLoading } = useQuery(
    ["revenue-summary", range],
    () => paymentAPI.getRevenueSummary({ range }),
    { keepPreviousData: true }
  );

  const { data: purchasesData, isLoading: isPurchasesLoading } = useQuery(
    ["purchases"],
    () => paymentAPI.getPurchasesList(1, 500),
    { keepPreviousData: true }
  );

  const { data: pricingData } = useQuery(
    "pricing-settings",
    paymentAPI.getPricingSettings,
    { keepPreviousData: true }
  );

  const summaryPayload = summaryData?.data?.data;
  const purchases = purchasesData?.data?.data?.purchases || [];
  const pricing = pricingData?.data?.data;

  const filteredPurchases = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return purchases;
    return purchases.filter((p: any) => {
      const name = p?.user?.name || "";
      const email = p?.user?.email || "";
      return (
        name.toLowerCase().includes(term) ||
        email.toLowerCase().includes(term)
      );
    });
  }, [purchases, searchTerm]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const totalFiltered = filteredPurchases.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / pageSize));
  const safePage = Math.min(currentPage, totalPages);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedPurchases = useMemo(() => {
    const start = (safePage - 1) * pageSize;
    return filteredPurchases.slice(start, start + pageSize);
  }, [filteredPurchases, pageSize, safePage]);

  const formatCurrency = (value: number) =>
    `$${Number(value || 0).toFixed(2)}`;

  const timeLimitedLabel = (purchase: any) => {
    if (purchase?.purchaseType !== "plan") return "-";
    const count = Number(pricing?.professionalPlanIntervalCount ?? 6);
    const unit = pricing?.professionalPlanIntervalUnit ?? "months";
    return `For ${count} ${count === 1 ? unit.replace(/s$/, "") : unit}`;
  };

  // Chart Data Formatting (uses API dailyRevenue)
  const chartData = useMemo(() => {
    const dailyRevenue = (summaryPayload?.dailyRevenue || []).map(
      (item: any) => ({
        date: item?._id || item?.date,
        revenue: Number(item?.revenue || 0),
      })
    );
    if (!dailyRevenue.length) {
      return [];
    }
    return aggregateRevenue(dailyRevenue, range);
  }, [summaryPayload, range]);

  const surveyData = [
    { name: "Professional", value: 172 },
    { name: "Starter Package", value: 180 },
  ];

  // Design tokens from image
  const CHART_BLUE = "#254391";
  const PIE_COLORS = ["#40C4E3", "#254391"];

  return (
    <div className="flex-1 space-y-8 p-2">
      {/* Header Section */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-slate-900">Revenue</h1>
        <p className="text-sm text-slate-500">Manage Revenue</p>
      </div>

      {/* Search Bar - Repositioned to align with the layout */}
      <div className="relative w-full max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <Input
          placeholder="Search users"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 rounded-xl bg-white border-slate-200"
        />
      </div>

      {/* Total Revenue Card - Matches Cyan design */}
      <Card className="p-6 bg-[#E0F7FA] border-none shadow-sm relative overflow-hidden">
        <div className="flex flex-col">
          <p className="text-[22px] font-bold text-slate-800">
            ${Number(summaryPayload?.totalRevenue ?? 0).toFixed(2)}
          </p>
          <p className="text-sm text-slate-500 mt-1">Total Revenue</p>
        </div>
        <div className="absolute right-6 top-1/2 -translate-y-1/2 w-10 h-10 bg-[#4DD0E1] rounded-full flex items-center justify-center text-white shadow-sm">
          <span className="font-bold">$</span>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-[#4DD0E1]" />
      </Card>

      {/* Analytics & Survey Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart Card */}
        <Card className="lg:col-span-2 p-6 border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-[17px] font-bold text-slate-800">
              Analytics & Reports for subscription
            </h2>
            <div className="flex gap-1 bg-slate-100 rounded-full p-1">
              {["day", "week", "month"].map((t) => (
                <button
                  key={t}
                  onClick={() => setRange(t as Range)}
                  className={`px-4 py-1.5 text-[11px] font-semibold rounded-full transition ${
                    range === t ? "bg-[#254391] text-white" : "text-slate-500"
                  }`}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#94A3B8" }} />
              <Tooltip
                cursor={{ fill: "#F8FAFC" }}
                formatter={(value: any) => [`$${Number(value || 0).toFixed(2)}`, "Revenue"]}
              />
              <Bar dataKey="value" fill={CHART_BLUE} radius={[2, 2, 0, 0]} barSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Pie Chart Card */}
        <Card className="p-6 border-slate-100 shadow-sm flex flex-col items-center">
          <h2 className="text-[17px] font-bold text-slate-800 self-start mb-4">
            Survey for Subscription
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={surveyData}
                innerRadius={0}
                outerRadius={90}
                paddingAngle={0}
                dataKey="value"
                stroke="none"
              >
                {surveyData.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-3 w-full">
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-[#254391]" />
              <span className="text-[14px] text-slate-600 font-medium">(Starter Package) Free: 60%</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-4 h-4 rounded-full bg-[#40C4E3]" />
              <span className="text-[14px] text-slate-600 font-medium">Professional: 40%</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Table Section - Aligned with UI headers */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 bg-white shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100">
              {["User", "Email", "Payment", "Subscription", "Status", "Time limited", "Action"].map((h) => (
                <th key={h} className="py-4 px-6 text-[13px] font-semibold text-slate-600">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {isPurchasesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`skeleton-${i}`} className="animate-pulse">
                  {Array.from({ length: 7 }).map((__, j) => (
                    <td key={j} className="py-4 px-6">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))
            ) : filteredPurchases.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-10 text-center text-sm text-slate-400"
                >
                  No purchases found.
                </td>
              </tr>
            ) : (
              paginatedPurchases.map((p: any, i: number) => {
                const subscription =
                  p?.purchaseType === "plan" ? "Professional" : "Starter";
                const isActive = p?.paymentStatus === "completed";
                return (
              <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                <td className="py-4 px-6">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-blue-500 font-bold mb-0.5">
                      Admin user
                    </span>
                    <span className="text-sm font-semibold text-slate-700">
                      {p?.user?.name || "Unknown"}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 text-sm text-slate-600">
                  {p?.user?.email || "-"}
                </td>
                <td className="py-4 px-6 text-sm font-bold text-slate-800">
                  {formatCurrency(p?.price)}
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`px-4 py-1 rounded-full text-xs font-bold border ${
                      subscription === "Professional"
                        ? "bg-green-50 text-green-600 border-green-100"
                        : "bg-slate-100 text-slate-600 border-slate-200"
                    }`}
                  >
                    {subscription}
                  </span>
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`px-4 py-1 rounded-full text-xs font-bold border ${
                      isActive
                        ? "bg-green-50 text-green-600 border-green-100"
                        : "bg-yellow-50 text-yellow-700 border-yellow-100"
                    }`}
                  >
                    {isActive ? "Active" : "Pending"}
                  </span>
                </td>
                <td className="py-4 px-6 text-sm text-slate-600">
                  {timeLimitedLabel(p)}
                </td>
                <td className="py-4 px-6">
                  <button className="p-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {!isPurchasesLoading && totalFiltered > 0 && (
        <div className="flex items-center justify-between border-t border-slate-100 px-6 py-3 bg-white rounded-b-xl">
          <p className="text-xs text-slate-500">
            Showing {(safePage - 1) * pageSize + 1} to {Math.min(safePage * pageSize, totalFiltered)} of {totalFiltered} results
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, safePage - 1))}
              disabled={safePage === 1}
              className="h-7 w-7 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {(() => {
              const end = Math.min(totalPages, safePage + 1);
              const start = Math.max(1, end - 2);
              return Array.from({ length: end - start + 1 }, (_, idx) => {
                const page = start + idx;
                const isActive = page === safePage;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`h-7 w-7 rounded-md border text-xs font-semibold ${
                      isActive
                        ? "bg-[#254391] text-white border-[#254391]"
                        : "border-slate-200 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              });
            })()}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, safePage + 1))}
              disabled={safePage >= totalPages}
              className="h-7 w-7 rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
