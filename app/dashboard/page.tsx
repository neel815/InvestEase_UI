"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { DashboardNav } from "@/components/DashboardNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import axios from "@/lib/axios";
import { RadialBarChart, RadialBar, Legend, Tooltip, ResponsiveContainer } from "recharts";

interface Goal {
  id: string;
  goal_type: string;
  target_amount: number;
  target_date: string;
  investment_mode: string;
  created_at: string;
  selected_basket?: string;
}

interface PortfolioStats {
  totalPortfolioValue: number;
  totalInvested: number;
  overallReturnPercentage: number;
  nextSipDate: string | null;
  goals: Goal[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<PortfolioStats>({
    totalPortfolioValue: 0,
    totalInvested: 0,
    overallReturnPercentage: 0,
    nextSipDate: null,
    goals: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const goalsResponse = await axios.get<Goal[]>("/goals/me");
        
        // Calculate stats based on goals
        let totalPortfolioValue = 0;
        let totalInvested = 0;
        let overallReturnPercentage = 0;
        let nextSipDate: string | null = null;

        if (goalsResponse.data.length > 0) {
          // TODO: Calculate actual portfolio stats from goal data
          // For now, showing placeholder values
          goalsResponse.data.forEach((goal) => {
            totalInvested += goal.target_amount * 0.1; // Placeholder
          });
          totalPortfolioValue = totalInvested * 1.05; // Assume 5% return
          overallReturnPercentage = 5;
          
          // Get earliest target date as next SIP date
          const dates = goalsResponse.data
            .map(g => new Date(g.target_date))
            .sort((a, b) => a.getTime() - b.getTime());
          if (dates.length > 0) {
            nextSipDate = dates[0].toISOString().split('T')[0];
          }
        }

        setStats({
          totalPortfolioValue,
          totalInvested,
          overallReturnPercentage,
          nextSipDate,
          goals: goalsResponse.data,
        });
      } catch (err: any) {
        const message = err.response?.data?.detail || "Failed to fetch portfolio stats";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const currency = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }),
    []
  );

  const chartData = useMemo(() => {
    if (stats.goals.length === 0) {
      return [{ name: "No goals", value: 0 }];
    }

    const totalProgress = stats.goals.reduce((sum) => sum + 10, 0) / stats.goals.length;
    return [
      {
        name: "Progress",
        value: totalProgress,
        fill: "#4f46e5",
      },
    ];
  }, [stats.goals]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />

        <main className="ml-64 min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="mb-16">
            <h1 className="text-4xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500 mt-2 text-base font-medium">Your investment portfolio at a glance</p>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-6 mb-8">
              <p className="text-sm font-semibold text-red-600">{error}</p>
            </div>
          )}

          {isLoading ? (
            <div className="text-center py-24">
              <div className="inline-block">
                <p className="text-slate-500 text-lg font-medium">Loading your portfolio...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Stat Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Portfolio Value */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <p className="text-sm font-semibold text-slate-500 mb-2">Total Portfolio Value</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stats.totalPortfolioValue > 0
                      ? currency.format(stats.totalPortfolioValue)
                      : "—"}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {stats.totalPortfolioValue > 0 ? "Across all goals" : "No investments yet"}
                  </p>
                </div>

                {/* Total Invested */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <p className="text-sm font-semibold text-slate-500 mb-2">Total Invested</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stats.totalInvested > 0
                      ? currency.format(stats.totalInvested)
                      : "—"}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {stats.totalInvested > 0 ? "Your contributions" : "Start investing"}
                  </p>
                </div>

                {/* Overall Return % */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <p className="text-sm font-semibold text-slate-500 mb-2">Overall Return %</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stats.overallReturnPercentage > 0
                      ? `${stats.overallReturnPercentage}%`
                      : "—"}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    {stats.overallReturnPercentage > 0 ? "Estimated annual returns" : "No returns yet"}
                  </p>
                </div>

                {/* Next SIP Date */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <p className="text-sm font-semibold text-slate-500 mb-2">Next SIP Date</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stats.nextSipDate ? new Date(stats.nextSipDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    {stats.nextSipDate ? "Earliest goal target" : "No SIPs scheduled"}
                  </p>
                </div>
              </div>

              {/* Progress Ring */}
              {stats.goals.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                  <h2 className="text-xl font-bold text-slate-900 mb-6">Progress Toward All Goals</h2>
                  <div className="flex justify-center">
                    <ResponsiveContainer width="100%" height={300}>
                      <RadialBarChart
                        data={chartData}
                        innerRadius="60%"
                        outerRadius="100%"
                        startAngle={180}
                        endAngle={0}
                      >
                        <RadialBar
                          background
                          dataKey="value"
                          cornerRadius={6}
                          label={{ position: "center", fill: "#000" }}
                        />
                        <Tooltip formatter={(value) => `${value.toFixed(1)}%`} />
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-center text-sm text-slate-500 mt-4">
                    {stats.goals.length} {stats.goals.length === 1 ? "goal" : "goals"} in progress
                  </p>
                </div>
              )}

              {/* No Goals Empty State */}
              {stats.goals.length === 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-16 text-center">
                  <div className="text-5xl mb-5 text-indigo-600">◌</div>
                  <h3 className="text-3xl font-bold text-slate-900 mb-4">
                    No goals yet
                  </h3>
                  <p className="text-slate-400 text-lg mb-10 font-medium">
                    Create your first investment goal to get started on your wealth-building journey!
                  </p>
                  <Link
                    href="/goal"
                    className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition duration-200"
                  >
                    Create Your First Goal
                  </Link>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
