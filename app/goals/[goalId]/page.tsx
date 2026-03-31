"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { isAxiosError } from "axios";
import { DashboardNav } from "@/components/DashboardNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import axios from "@/lib/axios";
import type { BasketType, SipPlan, GoalRecommendations } from "@/types";

interface Goal {
  id: string;
  goal_type: string;
  target_amount: number;
  target_date: string;
  investment_mode: string;
  created_at: string;
  selected_basket?: BasketType;
}

interface FundRecommendation {
  scheme_code: string;
  scheme_name: string;
  category: string;
  basket_type: BasketType;
  returns_1y: number;
  returns_3y: number;
  returns_5y: number;
}

export default function GoalDetailPage() {
  const params = useParams<{ goalId: string }>();
  const router = useRouter();
  const goalId = typeof params.goalId === "string" ? params.goalId : "";

  const [goal, setGoal] = useState<Goal | null>(null);
  const [sipPlan, setSipPlan] = useState<SipPlan | null>(null);
  const [recommendations, setRecommendations] = useState<GoalRecommendations | null>(null);
  const [selectedFunds, setSelectedFunds] = useState<FundRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!goalId) return;

    const fetchGoalDetails = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [goalRes, sipRes, recRes] = await Promise.all([
          axios.get<Goal>(`/goals/${goalId}`),
          axios.get<SipPlan>(`/goals/${goalId}/sip-plan`),
          axios.get<GoalRecommendations>(`/recommendations/${goalId}`),
        ]);

        setGoal(goalRes.data);
        setSipPlan(sipRes.data);
        setRecommendations(recRes.data);

        // Extract funds from selected basket
        if (goalRes.data.selected_basket && recRes.data.baskets) {
          const selectedBasket = recRes.data.baskets.find(
            (b) => b.basket_type === goalRes.data.selected_basket
          );
          if (selectedBasket) {
            setSelectedFunds(selectedBasket.funds);
          }
        }
      } catch (err: any) {
        const message = err.response?.data?.detail || "Failed to load goal details";
        setError(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGoalDetails();
  }, [goalId]);

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

  const basketLabels: Record<BasketType, string> = {
    conservative: "Conservative",
    moderate: "Moderate",
    aggressive: "Aggressive",
  };

  const investmentModeColors: Record<string, string> = {
    autopilot: "bg-blue-100 text-blue-700 border-blue-200",
    copilot: "bg-purple-100 text-purple-700 border-purple-200",
    manual: "bg-amber-100 text-amber-700 border-amber-200",
  };

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50">
          <DashboardNav />
          <main className="ml-64 min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="text-center py-24">
              <p className="text-slate-500 text-lg font-medium">Loading goal details...</p>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  if (!goal) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-slate-50">
          <DashboardNav />
          <main className="ml-64 min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
                <p className="text-red-700 font-semibold mb-4">{error || "Goal not found"}</p>
                <Link href="/goals" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                  ← Back to goals
                </Link>
              </div>
            </div>
          </main>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />

        <main className="ml-64 min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <Link href="/goals" className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm mb-4 inline-block">
                  ← Back to goals
                </Link>
                <h1 className="text-4xl font-bold text-slate-900 capitalize">
                  {goalTypeLabels[goal.goal_type] || goal.goal_type}
                </h1>
                <p className="text-slate-500 mt-2 text-base font-medium">Goal details and fund allocation</p>
              </div>
              <span
                className={`inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold ${
                  investmentModeColors[goal.investment_mode] || investmentModeColors.manual
                }`}
              >
                {investmentModeLabels[goal.investment_mode] || goal.investment_mode}
              </span>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-6">
                <p className="text-sm font-semibold text-red-600">{error}</p>
              </div>
            )}

            {/* Goal Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <p className="text-sm font-semibold text-slate-500 mb-2">Target Amount</p>
                <p className="text-3xl font-bold text-slate-900">{currency.format(goal.target_amount)}</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <p className="text-sm font-semibold text-slate-500 mb-2">Target Date</p>
                <p className="text-3xl font-bold text-slate-900">
                  {new Date(goal.target_date).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                <p className="text-sm font-semibold text-slate-500 mb-2">Status</p>
                <p className="text-3xl font-bold text-indigo-600">Active</p>
              </div>
            </div>

            {/* SIP Plan Summary */}
            {sipPlan && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">SIP Plan Summary</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-2">Monthly SIP</p>
                    <p className="text-2xl font-bold text-slate-900">{currency.format(sipPlan.monthly_sip)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-2">Total Investment</p>
                    <p className="text-2xl font-bold text-slate-900">{currency.format(sipPlan.total_invested)}</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-500 mb-2">Estimated Returns</p>
                    <p className="text-2xl font-bold text-green-600">{currency.format(sipPlan.estimated_returns)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Selected Fund Basket */}
            {goal.selected_basket && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
                <h2 className="text-2xl font-bold text-slate-900 mb-6">
                  Fund Basket: <span className="text-indigo-600">{basketLabels[goal.selected_basket]}</span>
                </h2>

                {selectedFunds.length > 0 ? (
                  <div className="space-y-4">
                    {selectedFunds.map((fund) => (
                      <div key={fund.scheme_code} className="border border-slate-200 rounded-xl p-4 hover:bg-slate-50 transition">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="font-semibold text-slate-900">{fund.scheme_name}</p>
                            <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600 mt-2">
                              {fund.category}
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                          <div className="rounded-lg bg-green-50 px-2 py-2 text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-green-700">1Y</p>
                            <p className="text-sm font-bold text-green-700">{fund.returns_1y}%</p>
                          </div>
                          <div className="rounded-lg bg-green-50 px-2 py-2 text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-green-700">3Y</p>
                            <p className="text-sm font-bold text-green-700">{fund.returns_3y}%</p>
                          </div>
                          <div className="rounded-lg bg-green-50 px-2 py-2 text-center">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-green-700">5Y</p>
                            <p className="text-sm font-bold text-green-700">{fund.returns_5y}%</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-500">Funds not available</p>
                )}
              </div>
            )}

            {/* Mode-Specific Action Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Actions</h2>

              <div className="space-y-3">
                {goal.investment_mode === "autopilot" && (
                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                    <p className="text-sm font-semibold text-blue-900 mb-3">
                      Your Autopilot mode is active. We're managing your investments based on your goal timeline.
                    </p>
                    <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition">
                      View Performance Dashboard
                    </button>
                  </div>
                )}

                {goal.investment_mode === "copilot" && (
                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-xl">
                    <p className="text-sm font-semibold text-purple-900 mb-3">
                      You're in Co-pilot mode. Review and approve recommended rebalancing.
                    </p>
                    <div className="space-y-2">
                      <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold text-sm transition">
                        View Recommendations
                      </button>
                      <button className="w-full px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-lg font-semibold text-sm transition">
                        View Rebalancing History
                      </button>
                    </div>
                  </div>
                )}

                {goal.investment_mode === "manual" && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                    <p className="text-sm font-semibold text-amber-900 mb-3">
                      You're managing this goal manually. Make your own investment decisions.
                    </p>
                    <div className="space-y-2">
                      <button className="w-full px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-semibold text-sm transition">
                        Add Funds Manually
                      </button>
                      <button className="w-full px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-700 rounded-lg font-semibold text-sm transition">
                        View Holdings
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation Links */}
            <div className="space-y-3">
              <Link
                href="/goals"
                className="block px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-center transition"
              >
                ← Back to goals
              </Link>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
