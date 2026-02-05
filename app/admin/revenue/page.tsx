"use client";

import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { paymentAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Search, DollarSign, Trash2 } from "lucide-react";
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

export default function RevenuePage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [range, setRange] = useState<Range>("day");

  const { data: summaryData, isLoading: isSummaryLoading } = useQuery(
    ["revenue-summary", range], // ✅ refetch when range changes
    () => paymentAPI.getRevenueSummary({ range }), // ✅ pass range to API (adjust if your API signature differs)
    {
      onError: (error: any) => {
        toast.error("Failed to load revenue summary");
        console.error("[v0] Revenue summary error:", error);
      },
      keepPreviousData: true,
    }
  );

  const { data: purchasesData, isLoading: isPurchasesLoading } = useQuery(
    ["purchases", currentPage],
    () => paymentAPI.getPurchasesList(currentPage, 10),
    {
      onError: (error: any) => {
        toast.error("Failed to load purchases");
        console.error("[v0] Purchases error:", error);
      },
      keepPreviousData: true,
    }
  );

  const { data: pricingData } = useQuery(
    "pricing-settings",
    paymentAPI.getPricingSettings,
    {
      onError: (error: any) => {
        console.error("[v0] Pricing settings error:", error);
      },
    }
  );

  const summaryPayload = summaryData?.data?.data;
  const purchasesPayload = purchasesData?.data?.data;
  const purchases = purchasesPayload?.purchases || [];
  const pricing = pricingData?.data?.data;

  const filteredPurchases = purchases.filter((purchase: any) => {
    const email = purchase.user?.email || "";
    const name = purchase.user?.name || "";
    return (
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  // ✅ now chart changes after clicking Day/Week/Month
  const chartData = useMemo(() => {
    if (!summaryPayload) return [];

    // assume API returns different arrays depending on range
    // - day => dailyRevenue
    // - week => weeklyRevenue
    // - month => monthlyRevenue
    const keyMap: Record<Range, string> = {
      day: "dailyRevenue",
      week: "weeklyRevenue",
      month: "monthlyRevenue",
    };

    const list = summaryPayload?.[keyMap[range]] || [];

    // fallback demo data if API empty
    if (!Array.isArray(list) || list.length === 0) {
      const labels =
        range === "day"
          ? ["1 D", "2 D", "3 D", "4 D", "5 D", "6 D", "7 D"]
          : range === "week"
          ? ["1 W", "2 W", "3 W", "4 W"]
          : ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
      return labels.map((label, idx) => ({
        label,
        value: [30, 65, 45, 120, 80, 100, 75][idx] ?? 50,
      }));
    }

    return list.map((item: any, index: number) => ({
      label:
        item.label ||
        item.date ||
        item.week ||
        item.month ||
        (range === "day"
          ? `${index + 1} D`
          : range === "week"
          ? `${index + 1} W`
          : `${index + 1} M`),
      value: item.count ?? item.revenue ?? item.value ?? 0,
    }));
  }, [summaryPayload, range]);

  const surveyData = useMemo(() => {
    const professional = purchases.filter((p: any) => p.purchaseType === "plan")
      .length;
    const starter = purchases.filter((p: any) => p.purchaseType !== "plan")
      .length;
    return [
      { name: "Professional", value: professional },
      { name: "Starter Package", value: starter },
    ];
  }, [purchases]);

  const COLORS = ["#2b6cb0", "#38b2ac"];

  // ✅ show title based on range
  const analyticsTitle = useMemo(() => {
    const suffix = range === "day" ? "Daily" : range === "week" ? "Weekly" : "Monthly";
    return `Analytics & Reports (${suffix}) for subscription`;
  }, [range]);

  return (
    <div className="flex-1 space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
            <Input
              placeholder="Search users"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
          <h1 className="text-3xl font-bold mt-6">Revenue</h1>
          <p className="text-muted-foreground">Manage Revenue</p>
        </div>
      </div>

      <Card className="p-6 bg-cyan-50 border-cyan-100 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-cyan-700">Total Revenue</p>
            {isSummaryLoading ? (
              <Skeleton className="h-8 w-32 mt-2" />
            ) : (
              <p className="text-3xl font-bold text-cyan-900 mt-2">
                ${summaryPayload?.totalRevenue ?? "0.00"}
              </p>
            )}
          </div>
          <div className="p-3 bg-cyan-200 rounded-full">
            <DollarSign className="w-6 h-6 text-cyan-700" />
          </div>
        </div>
        <div className="mt-4 h-1 bg-gradient-to-r from-cyan-400 to-cyan-600 rounded-full" />
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6">
          <div className="flex items-center justify-between mb-4">
            {/* ✅ fixed title + changes based on range */}
            <h2 className="text-lg font-semibold text-gray-900">
              {analyticsTitle}
            </h2>

            {/* ✅ Clicking Day/Week/Month triggers refetch + chart update */}
            <div className="flex gap-2 bg-gray-100 rounded-full p-1">
              {(["day", "week", "month"] as const).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setRange(item)}
                  className={`px-4 py-1 text-xs rounded-full transition ${
                    range === item
                      ? "bg-blue-700 text-white"
                      : "text-gray-600 hover:bg-white"
                  }`}
                >
                  {item.charAt(0).toUpperCase() + item.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#2b4c8b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Survey for Subscription
          </h2>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={surveyData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
              >
                {surveyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-700" />
              <span className="text-gray-600">Starter Package</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-teal-400" />
              <span className="text-gray-600">Professional</span>
            </div>
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  User
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Email
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Payment
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Subscription
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Status
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Time limited
                </th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700 text-sm">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {isPurchasesLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr
                    key={i}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-32" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-6 w-20" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-4 w-20" />
                    </td>
                    <td className="py-4 px-6">
                      <Skeleton className="h-8 w-10" />
                    </td>
                  </tr>
                ))
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-600">
                    No purchases found
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((purchase: any) => {
                  const subscription =
                    purchase.purchaseType === "plan" ? "Professional" : "Starter";
                  const timeLimited =
                    purchase.purchaseType === "plan"
                      ? `For ${
                          pricing?.professionalPlanIntervalCount || 3
                        } ${pricing?.professionalPlanIntervalUnit || "months"}`
                      : "-";
                  return (
                    <tr
                      key={purchase.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-4 px-6 text-sm text-gray-900">
                        {purchase.user?.name || "User"}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {purchase.user?.email || "N/A"}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-900">
                        ${purchase.price ?? "0.00"}
                      </td>
                      <td className="py-4 px-6 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            subscription === "Professional"
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {subscription}
                        </span>
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            purchase.paymentStatus === "completed"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {purchase.paymentStatus === "completed"
                            ? "Active"
                            : "Pending"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-600">
                        {timeLimited}
                      </td>
                      <td className="py-4 px-6">
                        <Button
                          size="icon"
                          className="h-9 w-9 rounded-full bg-red-100 text-red-700 hover:bg-red-200"
                          onClick={() => toast.info("Delete action coming soon")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {!isPurchasesLoading && purchasesPayload && (
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Showing {(currentPage - 1) * 10 + 1} to{" "}
              {Math.min(currentPage * 10, purchasesPayload?.meta?.total || 0)} of{" "}
              {purchasesPayload?.meta?.total || 0} results
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              >
                {"<"}
              </Button>

              {Array.from({
                length: Math.min(
                  3,
                  Math.ceil((purchasesPayload?.meta?.total || 0) / 10)
                ),
              }).map((_, i) => (
                <Button
                  key={i + 1}
                  variant={currentPage === i + 1 ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentPage(i + 1)}
                  className={currentPage === i + 1 ? "bg-blue-600 text-white" : ""}
                >
                  {i + 1}
                </Button>
              ))}

              <Button
                variant="outline"
                size="sm"
                disabled={
                  currentPage >=
                  Math.ceil((purchasesPayload?.meta?.total || 0) / 10)
                }
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                {">"}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
