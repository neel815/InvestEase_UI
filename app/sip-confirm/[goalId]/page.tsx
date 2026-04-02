"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardNav } from "@/components/DashboardNav";
import axios from "@/lib/axios";
import type { RecommendationBasket, SipPlan } from "@/types";

export default function SIPConfirmPage() {
  const params = useParams<{ goalId: string }>();
  const goalId = params.goalId || "";
  const router = useRouter();

  const [selectedBasket, setSelectedBasket] = useState<RecommendationBasket | null>(null);
  const [sipPlan, setSipPlan] = useState<SipPlan | null>(null);
  const [amount, setAmount] = useState<number | null>(null);
  const [minAmount, setMinAmount] = useState<number | null>(null);
  const [sipDay, setSipDay] = useState<number>(1);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!goalId) return;

    const load = async () => {
      try {
        // Fetch recommendations to get selected basket and funds
        const rec = await axios.get(`/recommendations/${goalId}`);
        const data = rec.data as any;
        const sel = data.baskets.find((b: RecommendationBasket) => b.recommended === true) || data.baskets.find((b: RecommendationBasket) => b.basket_type === data.selected_basket) || data.baskets[0];
        setSelectedBasket(sel);

        // Fetch SIP plan
        const planRes = await axios.get(`/goals/${goalId}/sip-plan`);
        const plan = planRes.data as SipPlan;
        setSipPlan(plan);
        setMinAmount(plan.monthly_sip);
        setAmount(Number(plan.monthly_sip));
      } catch (err: any) {
        setError(err.response?.data?.detail || "Failed to load SIP confirmation data");
      }
    };

    load();
  }, [goalId]);

  // Calculate next SIP due date based on selected sip_day
  // Handles edge cases where the target day doesn't exist (e.g., Feb 30 -> Feb 28/29)
  const calculateNextSipDate = (day: number): string => {
    const today = new Date();
    let currentYear = today.getFullYear();
    let currentMonth = today.getMonth();
    const currentDate = today.getDate();

    // Helper: get last day of a given month
    const getLastDayOfMonth = (year: number, month: number): number => {
      return new Date(year, month + 1, 0).getDate();
    };

    // Try this month with edge case handling
    const lastDayThisMonth = getLastDayOfMonth(currentYear, currentMonth);
    const targetDayThisMonth = Math.min(day, lastDayThisMonth);
    
    if (currentDate < targetDayThisMonth) {
      const d = new Date(currentYear, currentMonth, targetDayThisMonth);
      return d.toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    }

    // If current date is on or after sip_day this month, use next month
    let nextMonth = currentMonth + 1;
    let nextYear = currentYear;
    if (nextMonth > 11) {
      nextMonth = 0;
      nextYear = currentYear + 1;
    }

    // Apply edge case handling for next month too
    const lastDayNextMonth = getLastDayOfMonth(nextYear, nextMonth);
    const targetDayNextMonth = Math.min(day, lastDayNextMonth);
    
    const d = new Date(nextYear, nextMonth, targetDayNextMonth);
    return d.toLocaleString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  };

  const handleConfirm = async () => {
    if (!goalId || !selectedBasket || amount === null) return;
    if (minAmount && amount < minAmount) {
      setError("Monthly amount cannot be less than calculated minimum");
      return;
    }

    try {
      setIsSaving(true);
      await axios.post(`/portfolio/sip/confirm`, {
        goal_id: goalId,
        selected_basket: selectedBasket.basket_type,
        monthly_amount: amount,
        sip_day: sipDay,
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Failed to create SIP schedule");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />

        <main className="ml-64 min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-6">
            <h1 className="text-3xl font-bold text-slate-900">Confirm SIP for your Goal</h1>

            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                <p className="text-sm font-semibold text-red-600">{error}</p>
              </div>
            )}

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Selected Basket</h2>
                {selectedBasket ? (
                  <div className="space-y-3">
                    <p className="font-bold text-slate-900">{selectedBasket.basket_type.toUpperCase()}</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {selectedBasket.funds.map((f: any) => (
                        <div key={f.scheme_code} className="rounded-xl border p-3">
                          <p className="font-semibold text-slate-900">{f.scheme_name}</p>
                          <p className="text-sm text-slate-500">{f.category}</p>
                          <div className="mt-2 flex gap-2 text-sm">
                            <div className="text-green-700">1Y: {f.returns_1y}%</div>
                            <div className="text-green-700">3Y: {f.returns_3y}%</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-slate-500">Loading basket...</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Monthly SIP Amount</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min={minAmount || 0}
                    value={amount ?? ""}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    className="w-40 px-3 py-2 border rounded-xl"
                  />
                  <div className="text-sm text-slate-500">/ month</div>
                </div>
                {minAmount && amount !== null && amount < minAmount && (
                  <p className="text-xs text-red-600 mt-2">Amount cannot be less than recommended {minAmount}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-3">SIP Date of Month (1-31)</label>
                <div className="grid grid-cols-7 gap-2">
                  {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                    <button
                      key={day}
                      onClick={() => setSipDay(day)}
                      className={`aspect-square rounded-lg font-semibold text-sm transition ${
                        sipDay === day
                          ? "bg-indigo-600 text-white"
                          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                      }`}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                {sipDay >= 29 && (
                  <p className="text-xs text-slate-600 mt-3 p-2 bg-slate-50 rounded-lg">
                    ℹ️ For February and months with fewer days, your SIP will be scheduled on the last valid day of that month.
                  </p>
                )}
              </div>

              <div className="pt-2 text-sm text-slate-600 font-medium">
                Your first SIP will be on {calculateNextSipDate(sipDay)}
              </div>

              <div className="pt-4">
                <button
                  onClick={handleConfirm}
                  disabled={isSaving}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {isSaving ? "Starting..." : "Confirm & Start SIP"}
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
