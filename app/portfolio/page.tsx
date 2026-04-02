"use client";

import { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { DashboardNav } from "@/components/DashboardNav";
import axios from "@/lib/axios";

export default function PortfolioPage() {
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get("/portfolio/summary");
        setSummary(res.data);
      } catch (err) {
        // Handle 404 or other errors gracefully so the client UI doesn't crash
        // Show friendly message in the UI
        // eslint-disable-next-line no-console
        console.error("Failed to load portfolio summary:", err);
        setSummary(null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleToggle = async (sipId: string, action: "pause" | "resume") => {
    try {
      await axios.patch(`/portfolio/sip/schedule/${sipId}/${action}`);
      // Refresh
      const res = await axios.get("/portfolio/summary");
      setSummary(res.data);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Failed to toggle SIP:", err);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />

        <main className="ml-64 min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-900">Portfolio</h1>
            <p className="text-slate-500 mt-2">Detailed view of your goals and SIP schedules</p>

            {loading ? (
              <div className="py-12">Loading...</div>
            ) : summary === null ? (
              <div className="py-12 text-center text-slate-500">No portfolio data available.</div>
            ) : (
              <div className="space-y-6 mt-6">
                {summary?.per_goal?.map((g: any) => (
                  <div key={g.goal_id} className="rounded-2xl border bg-white p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-slate-900">{g.goal_type}</h3>
                        <p className="text-sm text-slate-500">Target: ₹{g.target_amount}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-500">Current Value</p>
                        <p className="text-lg font-bold">₹{g.current_value}</p>
                      </div>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm text-slate-500">Selected Basket: <span className="font-semibold text-slate-700">{g.selected_basket}</span></p>
                    </div>

                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">SIP Schedule</p>
                      <SIPList goalId={g.goal_id} onToggle={handleToggle} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function SIPList({ goalId, onToggle }: { goalId: string; onToggle: (sipId: string, action: "pause" | "resume") => void }) {
  const [sips, setSips] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await axios.get(`/portfolio/sip/schedule`);
        const data = res.data;
        let list: any[] = [];
        if (Array.isArray(data)) {
          // Expecting [{ sip, goal }, ...]
          list = data
            .filter((r: any) => r && r.goal && String(r.goal.id) === String(goalId))
            .map((r: any) => r.sip);
        } else if (data && Array.isArray(data.schedules)) {
          list = data.schedules.filter((s: any) => String(s.goal_id) === String(goalId));
        }
        setSips(list || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to load SIP schedules:", err);
      }
    };
    load();
  }, [goalId]);

  if (sips.length === 0) return <p className="text-sm text-slate-500">No SIPs scheduled for this goal</p>;

  return (
    <div className="space-y-3">
      {sips.map((s) => (
        <div key={s.id} className="border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">₹{s.monthly_amount} / month</p>
              <p className="text-sm text-slate-600">SIP every {s.sip_day}th of the month</p>
              <p className="text-xs text-slate-500">Next: {new Date(s.next_due_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
              {s.sip_day >= 29 && (
                <p className="text-xs text-slate-500 mt-2 p-2 bg-slate-50 rounded">
                  ℹ️ For shorter months, SIP scheduled on the last valid day.
                </p>
              )}
            </div>
            <div>
              {s.status === "active" ? (
                <button onClick={() => onToggle(s.id, "pause")} className="px-3 py-2 bg-slate-100 rounded-md">Pause</button>
              ) : (
                <button onClick={() => onToggle(s.id, "resume")} className="px-3 py-2 bg-indigo-600 text-white rounded-md">Resume</button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
