"use client";

import { useEffect, useMemo, useState } from "react";
import { isAxiosError } from "axios";
import { useParams, useRouter } from "next/navigation";

import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardNav } from "@/components/DashboardNav";
import axios from "@/lib/axios";
import type { BasketType, GoalRecommendations } from "@/types";

const basketLabels: Record<BasketType, string> = {
  conservative: "Conservative",
  moderate: "Moderate",
  aggressive: "Aggressive",
};

export default function RecommendationsPage() {
  const params = useParams<{ goalId: string }>();
  const router = useRouter();
  const goalId = typeof params.goalId === "string" ? params.goalId : "";

  const [data, setData] = useState<GoalRecommendations | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedBasket, setSelectedBasket] = useState<BasketType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [pollCountdown, setPollCountdown] = useState(5);

  useEffect(() => {
    if (!goalId) {
      return;
    }

    let cancelled = false;
    let pollTimer: NodeJS.Timeout | null = null;
    let countdownTimer: NodeJS.Timeout | null = null;

    const fetchRecommendations = async () => {
      try {
        setIsLoading(true);
        setIsProcessing(false);
        setError(null);
        
        try {
          const response = await axios.get<GoalRecommendations>(`/recommendations/${goalId}`);
          
          // Check if response is 202 (still processing)
          if (response.status === 202 || response.data?.status === 202) {
            if (!cancelled) {
              setIsProcessing(true);
              setData(null);
              setPollCountdown(5);
              // Set up auto-polling every 5 seconds
              startPolling();
            }
            return;
          }
          
          if (!cancelled) {
            setData(response.data);
            setIsProcessing(false);
            // Stop polling once we get real data
            if (pollTimer) clearTimeout(pollTimer);
            if (countdownTimer) clearInterval(countdownTimer);
          }
        } catch (err) {
          // Check if error response is 202
          if (isAxiosError(err) && err.response?.status === 202) {
            if (!cancelled) {
              setIsProcessing(true);
              setData(null);
              setPollCountdown(5);
              startPolling();
            }
            return;
          }
          throw err;
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message =
            isAxiosError<{ detail?: string }>(err) &&
            typeof err.response?.data?.detail === "string"
              ? err.response.data.detail
              : "Failed to load recommendations";
          setError(message);
          setIsProcessing(false);
          // Stop polling on error
          if (pollTimer) clearTimeout(pollTimer);
          if (countdownTimer) clearInterval(countdownTimer);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    const startPolling = () => {
      if (pollTimer) clearTimeout(pollTimer);
      if (countdownTimer) clearInterval(countdownTimer);
      
      // Start countdown display
      let remaining = 5;
      setPollCountdown(remaining);
      countdownTimer = setInterval(() => {
        remaining--;
        setPollCountdown(remaining);
        if (remaining <= 0 && !cancelled) {
          clearInterval(countdownTimer);
          // Fetch again after countdown
          fetchRecommendations();
        }
      }, 1000);
    };

    fetchRecommendations();

    return () => {
      cancelled = true;
      if (pollTimer) clearTimeout(pollTimer);
      if (countdownTimer) clearInterval(countdownTimer);
    };
  }, [goalId]);

  const sortedBaskets = useMemo(() => {
    if (!data) {
      return [];
    }

    const order: BasketType[] = ["conservative", "moderate", "aggressive"];
    return [...data.baskets].sort(
      (a, b) => order.indexOf(a.basket_type) - order.indexOf(b.basket_type)
    );
  }, [data]);

  const handleSelectBasket = async (basketType: BasketType) => {
    if (!goalId) {
      return;
    }

    try {
      setIsSaving(true);
      setError(null);

      await axios.patch(`/goals/${goalId}`, {
        selected_basket: basketType,
      });

      setSelectedBasket(basketType);
    } catch (err: unknown) {
      const message =
        isAxiosError<{ detail?: string }>(err) &&
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Failed to save selected basket";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmAndDashboard = () => {
    router.push("/dashboard");
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />

        <main className="ml-64 min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Fund Recommendation Engine</h1>
              <p className="mt-2 text-slate-500 font-medium">
                Compare 3 basket options and choose the one that fits your comfort level.
              </p>
            </div>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-5">
                <p className="text-sm font-semibold text-red-600">{error}</p>
              </div>
            )}

            {isProcessing ? (
              <div className="rounded-2xl border border-blue-200 bg-blue-50 p-12 text-center space-y-4">
                <div className="flex justify-center">
                  <div className="animate-spin">
                    <svg
                      className="w-8 h-8 text-blue-600"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-base font-semibold text-blue-900 mb-2">
                    Fetching Latest Fund Data
                  </p>
                  <p className="text-sm text-blue-700 mb-4">
                    We are analyzing the latest fund performance data for you. This takes about 30 seconds on the first load.
                  </p>
                  <p className="text-sm font-medium text-blue-600">
                    Checking again in {pollCountdown} seconds...
                  </p>
                </div>
              </div>
            ) : isLoading ? (
              <div className="rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-slate-500 font-medium">Loading recommendations...</p>
              </div>
            ) : !data ? (
              <div className="rounded-2xl border border-slate-200 p-12 text-center">
                <p className="text-slate-500 font-medium">No recommendations found for this goal.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {sortedBaskets.map((basket) => {
                  const highlighted = basket.recommended;

                  return (
                    <section
                      key={basket.basket_type}
                      className={`rounded-2xl border bg-white p-6 shadow-sm flex flex-col ${
                        highlighted
                          ? "border-indigo-600 ring-1 ring-indigo-100"
                          : "border-slate-200"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3 mb-5">
                        <h2 className="text-xl font-bold text-slate-900">
                          {basketLabels[basket.basket_type]}
                        </h2>
                        {highlighted && (
                          <span className="inline-flex items-center rounded-full bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1">
                            Recommended for you
                          </span>
                        )}
                      </div>

                      <div className="space-y-3 flex-1">
                        {basket.funds.map((fund) => (
                          <div
                            key={`${basket.basket_type}-${fund.scheme_code}`}
                            className="rounded-xl border border-slate-200 bg-white p-4"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="font-semibold text-slate-900 leading-5">
                                  {fund.scheme_name}
                                </p>
                                <span className="mt-2 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                                  {fund.category}
                                </span>
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-2">
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

                      <button
                        onClick={() => handleSelectBasket(basket.basket_type)}
                        disabled={isSaving}
                        className={`mt-6 w-full rounded-xl px-4 py-3 text-sm font-semibold transition ${
                          highlighted
                            ? "bg-indigo-600 text-white hover:bg-indigo-700"
                            : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isSaving ? "Saving..." : "Select this basket"}
                      </button>
                    </section>
                  );
                })}
              </div>
            )}

            {selectedBasket && (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-emerald-700 mb-1">Basket selected</p>
                  <p className="text-lg font-bold text-emerald-900">{basketLabels[selectedBasket]}</p>
                </div>
                <button
                  onClick={handleConfirmAndDashboard}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition duration-200"
                >
                  Confirm and go to dashboard
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
