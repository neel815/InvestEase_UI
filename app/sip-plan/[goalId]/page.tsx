"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardNav } from "@/components/DashboardNav";
import axios from "@/lib/axios";
import type { SipPlan } from "@/types";

interface GoalSummary {
  id: string;
  target_amount: number;
  target_date: string;
}

export default function SipPlanPage() {
  const params = useParams<{ goalId: string }>();
  const router = useRouter();
  const [returnRate, setReturnRate] = useState(12);
  const [plan, setPlan] = useState<SipPlan | null>(null);
  const [goalInfo, setGoalInfo] = useState<GoalSummary | null>(null);
  const [monthlyInvestment, setMonthlyInvestment] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hasError, setHasError] = useState(false);
  const hasLoadedRef = useRef(false);

  const goalId = typeof params.goalId === "string" ? params.goalId : "";

  const currency = useMemo(
    () =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }),
    []
  );

  const formattedTargetDate = useMemo(() => {
    if (!goalInfo?.target_date) {
      return "your target date";
    }

    return new Date(goalInfo.target_date).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, [goalInfo?.target_date]);

  const targetCorpus = useMemo(() => {
    if (goalInfo?.target_amount) {
      return goalInfo.target_amount;
    }

    if (!plan) {
      return 0;
    }

    return plan.total_invested + plan.estimated_returns;
  }, [goalInfo?.target_amount, plan]);

  const totalMonths = useMemo(() => {
    if (!plan || plan.monthly_sip <= 0) {
      return 1;
    }
    return Math.max(1, Math.round(plan.total_invested / plan.monthly_sip));
  }, [plan]);

  const projectedCorpus = useMemo(() => {
    if (!plan) {
      return 0;
    }

    const monthlyRate = (returnRate / 100) / 12;
    if (monthlyRate === 0) {
      return monthlyInvestment * totalMonths;
    }

    return monthlyInvestment * (((1 + monthlyRate) ** totalMonths - 1) / monthlyRate);
  }, [monthlyInvestment, plan, returnRate, totalMonths]);

  const shortfall = useMemo(() => Math.max(0, targetCorpus - projectedCorpus), [projectedCorpus, targetCorpus]);
  const isOnTrack = projectedCorpus >= targetCorpus;

  useEffect(() => {
    if (!goalId) {
      return;
    }

    let isCancelled = false;

    const fetchGoal = async () => {
      try {
        const response = await axios.get<GoalSummary[]>("/goals/me");
        if (!isCancelled) {
          const found = response.data.find((goal) => goal.id === goalId) || null;
          setGoalInfo(found);
        }
      } catch {
        if (!isCancelled) {
          setGoalInfo(null);
        }
      }
    };

    fetchGoal();

    return () => {
      isCancelled = true;
    };
  }, [goalId]);

  useEffect(() => {
    if (!goalId) {
      return;
    }

    let isCancelled = false;
    const debounce = setTimeout(async () => {
      if (!hasLoadedRef.current) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setHasError(false);

      try {
        const response = await axios.get<SipPlan>(`/goals/${goalId}/sip-plan`, {
          params: { return_rate: returnRate },
        });

        if (!isCancelled) {
          setPlan(response.data);
          setMonthlyInvestment(response.data.monthly_sip);
          hasLoadedRef.current = true;
        }
      } catch (err: unknown) {
        if (!isCancelled) {
          setHasError(true);
          if (isAxiosError(err) && err.response?.status === 401) {
            return;
          }
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    }, 200);

    return () => {
      isCancelled = true;
      clearTimeout(debounce);
    };
  }, [goalId, returnRate]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />

        <main className="ml-64 min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">SIP Planner</h1>
                <p className="mt-2 text-slate-500">
                  Tune expected returns and preview your path to the goal.
                </p>
              </div>
              {isRefreshing && (
                <p className="text-sm text-slate-500 font-medium">Updating plan...</p>
              )}
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <label htmlFor="returnRate" className="text-sm font-semibold text-slate-700">
                  Expected Annual Return Rate
                </label>
                <span className="text-sm font-bold text-indigo-600">{returnRate}%</span>
              </div>
              <input
                id="returnRate"
                type="range"
                min={8}
                max={15}
                step={0.1}
                value={returnRate}
                onChange={(e) => setReturnRate(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
              <div className="mt-2 flex justify-between text-xs text-slate-500">
                <span>8%</span>
                <span>15%</span>
              </div>
              <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs font-medium text-amber-800">
                Projections are estimates based on assumed return rates and are not guaranteed.
              </p>
            </div>

            {isLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
                <div className="text-indigo-600 text-3xl mb-3">◌</div>
                <p className="text-slate-500 font-medium">Preparing your SIP plan...</p>
              </div>
            ) : hasError || !plan ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 text-center">
                <div className="text-indigo-600 text-3xl mb-3">◌</div>
                <p className="text-slate-700 font-semibold">We couldn&apos;t load your SIP plan right now.</p>
                <p className="text-slate-400 mt-1">Please try again in a moment.</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 border-l-4 border-l-indigo-600">
                    <p className="text-sm font-semibold text-slate-500">Min. monthly investment needed</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {currency.format(plan.monthly_sip)}
                    </p>
                    <p className="mt-2 text-xs text-slate-500">
                      to reach your {currency.format(targetCorpus)} goal by {formattedTargetDate}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 border-l-4 border-l-indigo-600">
                    <p className="text-sm font-semibold text-slate-500">Total You Invest</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {currency.format(plan.total_invested)}
                    </p>
                  </div>

                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 border-l-4 border-l-indigo-600">
                    <p className="text-sm font-semibold text-slate-500">Estimated Returns</p>
                    <p className="mt-2 text-3xl font-bold text-slate-900">
                      {currency.format(plan.estimated_returns)}
                    </p>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">What if I invest more?</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Try your own monthly amount to see how it changes your final outcome.
                    </p>
                  </div>

                  <div>
                    <label htmlFor="monthlyInvestment" className="block text-sm font-semibold text-slate-700 mb-2">
                      Monthly amount you can invest
                    </label>
                    <div className="relative max-w-md">
                      <span className="absolute left-4 top-3 text-slate-400 font-semibold">₹</span>
                      <input
                        id="monthlyInvestment"
                        type="number"
                        min={0}
                        value={Number.isFinite(monthlyInvestment) ? monthlyInvestment : 0}
                        onChange={(e) => setMonthlyInvestment(Math.max(0, Number(e.target.value) || 0))}
                        className="w-full pl-8 pr-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 border-l-4 border-l-indigo-600">
                      <p className="text-sm font-semibold text-slate-500">Projected corpus</p>
                      <p className="mt-2 text-3xl font-bold text-slate-900">
                        {currency.format(projectedCorpus)}
                      </p>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 border-l-4 border-l-indigo-600">
                      <p className="text-sm font-semibold text-slate-500">Goal status</p>
                      <div className="mt-3">
                        {isOnTrack ? (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            On track
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                            Short by {currency.format(shortfall)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <h2 className="text-xl font-semibold text-slate-900 mb-4">Projected Portfolio Growth</h2>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={plan.year_by_year} margin={{ top: 8, right: 20, left: 16, bottom: 8 }}>
                        <CartesianGrid stroke="#e2e8f0" strokeDasharray="4 4" />
                        <XAxis
                          dataKey="year"
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: "#cbd5e1" }}
                          label={{ value: "Year", position: "insideBottom", offset: -4, fill: "#64748b" }}
                        />
                        <YAxis
                          tick={{ fill: "#64748b", fontSize: 12 }}
                          tickLine={false}
                          axisLine={{ stroke: "#cbd5e1" }}
                          tickFormatter={(value: number) => `${Math.round(value / 100000)}L`}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 1px 2px 0 rgba(15, 23, 42, 0.08)",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="projected_value"
                          stroke="#4f46e5"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#4f46e5", stroke: "#ffffff", strokeWidth: 2 }}
                          activeDot={{ r: 6 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <button
                    onClick={() => router.push(`/goals/${goalId}`)}
                    className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition duration-200"
                  >
                    View Goal Details
                  </button>
                  <button
                    onClick={() => router.push(`/recommendations/${goalId}`)}
                    className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition duration-200"
                  >
                    Continue to fund selection
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
