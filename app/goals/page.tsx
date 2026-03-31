"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardNav } from "@/components/DashboardNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import axios from "@/lib/axios";

interface Goal {
  id: string;
  goal_type: string;
  target_amount: number;
  target_date: string;
  investment_mode: string;
  created_at: string;
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGoals = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get<Goal[]>("/goals/me");
        setGoals(response.data);
      } catch (err: any) {
        const message = err.response?.data?.detail || "Failed to fetch goals";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoals();
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

  const goalTypeLabels: Record<string, string> = {
    retirement: "Retirement",
    house: "House",
    education: "Education",
    wealth: "Wealth",
  };

  const investmentModeLabels: Record<string, string> = {
    autopilot: "Autopilot",
    copilot: "Co-pilot",
    manual: "Manual",
  };

  const investmentModeColors: Record<string, string> = {
    autopilot: "bg-blue-100 text-blue-700 border-blue-200",
    copilot: "bg-purple-100 text-purple-700 border-purple-200",
    manual: "bg-amber-100 text-amber-700 border-amber-200",
  };

  // Mock progress calculation - in production, this would come from backend
  const getProgressPercentage = (goal: Goal) => {
    const createdDate = new Date(goal.created_at);
    const targetDate = new Date(goal.target_date);
    const now = new Date();
    const totalTime = targetDate.getTime() - createdDate.getTime();
    const elapsedTime = now.getTime() - createdDate.getTime();
    return Math.min(100, Math.max(0, Math.round((elapsedTime / totalTime) * 100)));
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />

        <main className="ml-64 min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-12 flex justify-between items-center">
              <div>
                <h1 className="text-4xl font-bold text-slate-900">Your Goals</h1>
                <p className="text-slate-500 mt-2 text-base font-medium">View and manage all your investment goals</p>
              </div>
              <Link
                href="/goal"
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition duration-200"
              >
                New Goal
              </Link>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-6 mb-8">
                <p className="text-sm font-semibold text-red-600">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-24">
                <p className="text-slate-500 text-lg font-medium">Loading your goals...</p>
              </div>
            ) : goals.length === 0 ? (
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
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {goals.map((goal) => {
                  const progressPercentage = getProgressPercentage(goal);
                  const targetDateFormatted = new Date(goal.target_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  });

                  return (
                    <div
                      key={goal.id}
                      className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-full hover:shadow-md transition duration-200"
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-slate-900 capitalize">
                            {goalTypeLabels[goal.goal_type] || goal.goal_type}
                          </h3>
                          <p className="text-sm text-slate-500 mt-1">Target: {targetDateFormatted}</p>
                        </div>
                      </div>

                      {/* Target Amount */}
                      <div className="mb-5">
                        <p className="text-sm font-semibold text-slate-500 mb-1">Target Amount</p>
                        <p className="text-3xl font-bold text-slate-900">
                          {currency.format(goal.target_amount)}
                        </p>
                      </div>

                      {/* Investment Mode Badge */}
                      <div className="mb-5">
                        <span
                          className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                            investmentModeColors[goal.investment_mode] || investmentModeColors.manual
                          }`}
                        >
                          {investmentModeLabels[goal.investment_mode] || goal.investment_mode}
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-6 flex-1">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-semibold text-slate-500">Progress</p>
                          <p className="text-sm font-bold text-indigo-600">{progressPercentage}%</p>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2">
                          <div
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* View Button */}
                      <Link
                        href={`/goals/${goal.id}`}
                        className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition duration-200 text-center"
                      >
                        View
                      </Link>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
