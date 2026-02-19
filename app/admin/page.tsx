"use client";

import { useMemo, useState } from "react";
import { useQuery } from "react-query";
import { dashboardAPI, userAPI } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import {
  Users,
  DollarSign,
  Filter,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

/** ---------- Helpers ---------- */
const PIE_COLORS = ["#1E3A8A", "#22D3EE"];

function safeNumber(v: unknown) {
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v.replace(/,/g, ""));
  return Number(v);
}

function formatCurrency(v: unknown) {
  const n = safeNumber(v);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(Number.isFinite(n) ? n : 0);
}

function formatShortDate(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", day: "2-digit" });
}

function getISOWeekKey(dateStr: string) {
  // Week key: "YYYY-W##"
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;

  // ISO week calculation (no external libs)
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
}

function getMonthKey(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

function aggregate(
  rows: Array<{ date: string; revenue: number; count: number }>,
  mode: "Day" | "Week" | "Month"
) {
  if (mode === "Day") {
    return rows.map((r) => ({
      name: formatShortDate(r.date),
      val: r.revenue ?? 0,
      count: r.count ?? 0,
    }));
  }

  const map = new Map<
    string,
    { name: string; val: number; count: number }
  >();

  for (const r of rows) {
    const key = mode === "Week" ? getISOWeekKey(r.date) : getMonthKey(r.date);
    const prev = map.get(key) || { name: key, val: 0, count: 0 };
    prev.val += r.revenue ?? 0;
    prev.count += r.count ?? 0;
    map.set(key, prev);
  }

  // Keep chronological-ish order by parsing best effort:
  const out = Array.from(map.values());
  out.sort((a, b) => a.name.localeCompare(b.name));
  return out;
}

/** ---------- Stat Card ---------- */
const StatCard = ({
  icon: Icon,
  title,
  value,
  isLoading = false,
  accentColor = "bg-blue-500",
  bgColor = "bg-white",
  borderColor = "border-blue-500",
  isCurrency = false,
}: {
  icon: any;
  title: string;
  value: string | number;
  isLoading?: boolean;
  accentColor?: string;
  bgColor?: string;
  borderColor?: string;
  isCurrency?: boolean;
}) => {
  return (
    <div
      className={`
        relative overflow-hidden
        p-6
        ${bgColor}
        rounded-xl
        shadow-sm hover:shadow-md transition-shadow duration-200
        border-b-4 ${borderColor}
        flex items-center justify-between
      `}
    >
      <div className="space-y-1">
        <p className="text-sm font-medium text-slate-500 tracking-tight">
          {title}
        </p>
        <h3 className="text-2xl md:text-3xl font-bold text-slate-800 tabular-nums">
          {isLoading ? (
            <div className="h-9 w-24 bg-slate-200 animate-pulse rounded-md" />
          ) : isCurrency ? (
            formatCurrency(value)
          ) : (
            value
          )}
        </h3>
      </div>

      <div
        className={`
          p-3.5 rounded-full ${accentColor} 
          text-white shadow-inner
          flex items-center justify-center
          ring-1 ring-white/20
        `}
      >
        <Icon size={24} strokeWidth={2.2} />
      </div>

      <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10 blur-xl pointer-events-none" />
    </div>
  );
};

export default function AdminDashboard() {
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [timeFilter, setTimeFilter] = useState<"Day" | "Week" | "Month">("Day");
  const rangeParam = timeFilter.toLowerCase();

  // Pagination
  const [page, setPage] = useState(1);
  const LIMIT = 8;

  const {
    data: dashboardData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery(
    ["dashboard-overview", page, LIMIT, rangeParam],
    // Make sure your API supports params. If not, adjust here.
    () => dashboardAPI.getOverview({ page, limit: LIMIT, range: rangeParam }),
    {
      onError: () => toast.error("Failed to load dashboard data"),
      keepPreviousData: true,
    }
  );

  // Your API shape (based on what you pasted):
  // dashboardData?.data?.data => payload
  const payload = dashboardData?.data?.data;

  /** ---------- Charts ---------- */
  const dailyRows = (payload?.revenue?.dailyRevenue ?? []) as Array<{
    date: string;
    revenue: number;
    count: number;
  }>;

  const chartData = useMemo(() => {
    return aggregate(dailyRows, timeFilter);
  }, [dailyRows, timeFilter]);

  const subscriptionData = useMemo(
    () => [
      {
        name: "Starter Package",
        value: payload?.subscriptionBreakdown?.freeCount || 0,
      },
      {
        name: "Professional",
        value: payload?.subscriptionBreakdown?.proCount || 0,
      },
    ],
    [payload]
  );

  /** ---------- Table Pagination Derived ---------- */
  // If your backend returns these, we will use them:
  const totalUsers = payload?.totals?.totalUsers ?? 0;
  const recentUsers = payload?.recentUsers ?? [];

  const totalPages =
    payload?.pagination?.totalPages ||
    (totalUsers ? Math.ceil(totalUsers / LIMIT) : 1);

  const showingFrom = totalUsers ? (page - 1) * LIMIT + 1 : 0;
  const showingTo = totalUsers
    ? Math.min(page * LIMIT, totalUsers)
    : recentUsers.length;

  const canPrev = page > 1;
  const canNext = page < totalPages;

  /** ---------- Actions ---------- */
  const handleDeleteUser = async () => {
    if (!selectedUserId) return;
    try {
      await userAPI.deleteUser(selectedUserId);
      toast.success("User deleted successfully");
      setIsDeleteDialogOpen(false);

      // If deleting last item on the page, step back a page (optional safety)
      if (recentUsers.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        refetch();
      }
    } catch (error) {
      toast.error("Failed to delete user");
    }
  };

  return (
    <div className="">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-[#1E3A8A]">Dashboard</h1>
          <p className="text-slate-500 text-sm mt-1">
            Welcome back to your admin panel
          </p>
        </div>

        <Button
          variant="outline"
          className="border-slate-200 bg-white text-slate-600 gap-2 hover:bg-slate-50 h-10 px-6"
          onClick={() => toast.info("Add your filter action here")}
        >
          <Filter className="w-4 h-4" /> Filter
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total User"
          value={payload?.totals?.totalUsers ?? 0}
          bgColor="bg-red-50"
          accentColor="bg-red-500"
          borderColor="border-red-500"
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Starter User"
          value={payload?.totals?.totalStarter ?? 0}
          bgColor="bg-blue-50"
          accentColor="bg-blue-600"
          borderColor="border-blue-600"
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Professional User"
          value={payload?.totals?.totalProfessional ?? 0}
          bgColor="bg-green-50"
          accentColor="bg-green-600"
          borderColor="border-green-600"
          icon={Users}
          isLoading={isLoading}
        />
        <StatCard
          title="Total Revenue"
          value={payload?.totals?.totalRevenue ?? 0} // ✅ pass number (no toLocaleString)
          bgColor="bg-cyan-50"
          accentColor="bg-cyan-400"
          borderColor="border-cyan-400"
          icon={DollarSign}
          isCurrency
          isLoading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card className="lg:col-span-2 p-6 border-none bg-white shadow-sm rounded-xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                Analytics & Reports
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Revenue over time (based on API)
              </p>
            </div>

            <div className="bg-slate-100 p-1 rounded-full flex gap-1">
              {["Day", "Week", "Month"].map((t) => (
                <button
                  key={t}
                  onClick={() => setTimeFilter(t as any)}
                  className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${
                    timeFilter === t
                      ? "bg-[#1E3A8A] text-white shadow-sm"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData}>
              <CartesianGrid vertical={false} stroke="#F1F5F9" />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: "#94a3b8", fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: "#F8FAFC" }}
                formatter={(value: any) => [formatCurrency(value), "Revenue"]}
              />
              <Bar
                dataKey="val"
                fill="#1E3A8A"
                radius={[4, 4, 0, 0]}
                barSize={45}
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 border-none bg-white shadow-sm rounded-xl">
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Survey for Subscription
          </h2>

          <div className="relative flex justify-center h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={subscriptionData}
                  innerRadius={0}
                  outerRadius={100}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {subscriptionData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index]} stroke="none" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>

            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="absolute top-[35%] left-[18%] text-[10px] text-center font-bold text-slate-700">
                Professional
                <br />
                {payload?.subscriptionBreakdown?.proCount ?? 0}
              </div>
              <div className="absolute top-[50%] right-[10%] text-[10px] text-center font-bold text-white">
                Starter Package
                <br />
                {payload?.subscriptionBreakdown?.freeCount ?? 0}
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-3">
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <div className="w-4 h-4 rounded-full bg-[#1E3A8A]" />
              (Starter Package) Free:{" "}
              {payload?.subscriptionBreakdown?.freePercent ?? 0}%
            </div>
            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
              <div className="w-4 h-4 rounded-full bg-[#22D3EE]" />
              Professional: {payload?.subscriptionBreakdown?.proPercent ?? 0}%
            </div>
          </div>
        </Card>
      </div>

      {/* Table */}
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Recent Users</h2>
          <p className="text-xs text-slate-400 mt-1">
            {isFetching ? "Refreshing..." : "Latest registered users"}
          </p>
        </div>
      </div>

      <Card className="border-none bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-slate-400 text-[13px] font-semibold border-b border-slate-50 uppercase tracking-wider bg-slate-50/30">
              <tr>
                <th className="px-8 py-5">User Name</th>
                <th className="px-8 py-5 text-center">Email</th>
                <th className="px-8 py-5 text-center">Joined Date</th>
                <th className="px-8 py-5 text-center">Payable</th>
                <th className="px-8 py-5 text-center">Plan Name</th>
                <th className="px-8 py-5 text-center">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-50">
              {(recentUsers ?? []).map((user: any) => (
                <tr
                  key={user.id}
                  className="text-slate-600 hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-8 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-[#1E3A8A] font-bold">
                        {String(user?.name || "?").charAt(0)}
                      </div>
                      <span className="font-semibold text-slate-700">
                        {user?.name || "Unknown"}
                      </span>
                    </div>
                  </td>

                  <td className="px-8 py-4 text-center text-[13px]">
                    {user?.email || "-"}
                  </td>

                  <td className="px-8 py-4 text-center text-[13px]">
                    {user?.joinedAt
                      ? new Date(user.joinedAt).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="px-8 py-4 text-center font-bold text-slate-800">
                    {formatCurrency(user?.payable ?? 0)}
                  </td>

                  <td className="px-8 py-4 text-center text-[13px] font-medium">
                    {user?.plan || "-"}
                  </td>

                  <td className="px-8 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 text-[11px] border-slate-200 text-slate-500 px-4 hover:bg-red-50"
                        onClick={() => {
                          setSelectedUserId(user.id);
                          setIsDeleteDialogOpen(true);
                        }}
                      >
                        Delete
                      </Button>

                      <Button
                        size="sm"
                        className="h-8 text-[11px] bg-[#1E3A8A] hover:bg-[#152a61] text-white px-5 rounded-lg shadow-sm"
                      >
                        {user?.status ? String(user.status) : "Active"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {!isLoading && (recentUsers?.length ?? 0) === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-8 py-10 text-center text-slate-400 text-sm"
                  >
                    No users found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 flex items-center justify-between border-t border-slate-50 text-slate-500 text-xs bg-slate-50/20">
          <span>
            {totalUsers ? (
              <>
                Showing {showingFrom} to {showingTo} of {totalUsers} results
              </>
            ) : (
              <>Showing {recentUsers?.length ?? 0} results</>
            )}
          </span>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg border-slate-200"
              disabled={!canPrev}
              onClick={() => canPrev && setPage((p) => p - 1)}
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Page indicator */}
            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg bg-[#1E3A8A] text-white border-none shadow-sm"
              disabled
            >
              {page}
            </Button>

            <Button
              variant="outline"
              size="icon"
              className="w-8 h-8 rounded-lg border-slate-200"
              disabled={!canNext}
              onClick={() => canNext && setPage((p) => p + 1)}
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            {/* Optional total pages */}
            <span className="ml-2 text-[11px] text-slate-400">
              Page {page} / {totalPages || 1}
            </span>
          </div>
        </div>
      </Card>

      {/* Delete dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="bg-white rounded-2xl border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-slate-900">
              Confirm Deletion
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              Are you sure you want to remove this user? This action is
              permanent.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="flex gap-3 justify-end mt-4">
            <AlertDialogCancel className="rounded-xl border-slate-200">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-6"
            >
              Delete
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
