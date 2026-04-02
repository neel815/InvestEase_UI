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

interface FundSearchResult {
  scheme_code: string;
  scheme_name: string;
}

interface FundDetails {
  scheme_code: string;
  scheme_name: string;
  category: string;
  current_nav: number;
  nav_history: Array<{ date: string; nav: string }>;
}

interface ExploreHolding {
  id: string;
  scheme_code: string;
  scheme_name: string;
  category: string;
  units: number;
  average_nav: number;
  invested_amount: number;
  current_value: number;
  return_percentage: number;
}

interface ExploreHoldingsList {
  holdings: ExploreHolding[];
  total_invested: number;
  total_current_value: number;
  overall_return_percentage: number;
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

  // Explore state
  const [activeTab, setActiveTab] = useState<"overview" | "explore">("overview");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<FundSearchResult[]>([]);
  const [selectedFund, setSelectedFund] = useState<FundDetails | null>(null);
  const [investments, setInvestments] = useState<ExploreHoldingsList | null>(null);
  const [investAmount, setInvestAmount] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [navHistory, setNavHistory] = useState<Array<{ date: string; value: number }>>([]);
  const [exploreError, setExploreError] = useState<string | null>(null);

  // Mode switch modal state
  const [showModeModal, setShowModeModal] = useState(false);
  const [isSwitchingMode, setIsSwitchingMode] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"copilot" | "manual" | null>(null);
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

  // Load explore holdings when explore tab is active
  useEffect(() => {
    if (!goalId || activeTab !== "explore") return;

    const loadHoldings = async () => {
      try {
        setExploreError(null);
        const res = await axios.get(`/explore/holdings/${goalId}`);
        setInvestments(res.data);
      } catch (err: any) {
        console.error("Failed to load holdings:", err);
        if (err.response?.status === 401) {
          setExploreError("Session expired — please log in again");
          setTimeout(() => window.location.href = "/login", 2000);
        } else {
          setExploreError("Failed to load holdings. Please try again.");
        }
      }
    };

    loadHoldings();
  }, [goalId, activeTab]);

  // Debounced search with enhanced logging and error handling
  useEffect(() => {
    if (!searchQuery || searchQuery.length < 1) {
      setSearchResults([]);
      setExploreError(null);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        setExploreError(null);
        
        const token = localStorage.getItem("token");
        console.log("🔍 Searching for:", searchQuery);
        console.log("📍 API URL:", axios.defaults.baseURL);
        console.log("🔐 Token value:", token ? `${token.substring(0, 20)}...` : "NOT FOUND");
        
        const res = await axios.get("/explore/search", {
          params: { q: searchQuery },
        });
        console.log("✅ Search results:", res.data);
        setSearchResults(res.data);
      } catch (err: any) {
        console.error("❌ Search failed:", err);
        console.error("Error details:", {
          message: err.message,
          status: err.response?.status,
          statusText: err.response?.statusText,
          data: err.response?.data,
          url: err.config?.url,
          baseURL: err.config?.baseURL,
          headers: err.config?.headers,
        });
        
        if (err.response?.status === 401) {
          setExploreError("Session expired — please log in again");
          setTimeout(() => window.location.href = "/login", 2000);
        } else if (err.message === "Network Error") {
          setExploreError("Network connection failed. Please check your internet and try again.");
        } else {
          setExploreError(`Search failed: ${err.response?.data?.detail || err.message}`);
        }
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handler to select fund from search and load full details
  const handleSelectFund = async (fund: FundSearchResult) => {
    try {
      setExploreError(null);
      console.log("📥 Loading fund details for:", fund.scheme_code);
      const res = await axios.get(`/explore/fund/${fund.scheme_code}`);
      console.log("✅ Fund details loaded:", res.data);
      setSelectedFund(res.data);
      setSearchQuery(""); // Clear search
      setSearchResults([]);
    } catch (err: any) {
      console.error("❌ Failed to load fund details:", err);
      if (err.response?.status === 401) {
        setExploreError("Session expired — please log in again");
        setTimeout(() => window.location.href = "/login", 2000);
      } else {
        setExploreError(`Failed to load fund details: ${err.response?.data?.detail || err.message}`);
      }
    }
  };

  // Handler to invest in selected fund
  const handleInvest = async () => {
    if (!selectedFund || !investAmount || !goalId) return;

    try {
      setExploreError(null);
      console.log("💰 Investing in:", selectedFund.scheme_name);
      await axios.post("/explore/invest", {
        goal_id: goalId,
        scheme_code: selectedFund.scheme_code,
        scheme_name: selectedFund.scheme_name,
        category: selectedFund.category,
        amount: parseFloat(investAmount),
      });

      console.log("✅ Investment successful");
      // Clear state and reload holdings
      setInvestAmount("");
      setSelectedFund(null);
      const res = await axios.get(`/explore/holdings/${goalId}`);
      setInvestments(res.data);
    } catch (err: any) {
      console.error("❌ Investment failed:", err);
      if (err.response?.status === 401) {
        setExploreError("Session expired — please log in again");
        setTimeout(() => window.location.href = "/login", 2000);
      } else {
        setExploreError(`Investment failed: ${err.response?.data?.detail || err.message}`);
      }
    }
  };

  // Handler to delete a holding
  const handleDeleteHolding = async (holdingId: string) => {
    if (!goalId) return;

    try {
      setExploreError(null);
      console.log("🗑️ Deleting holding:", holdingId);
      await axios.delete(`/explore/holdings/${holdingId}`);
      console.log("✅ Holding deleted");
      const res = await axios.get(`/explore/holdings/${goalId}`);
      setInvestments(res.data);
    } catch (err: any) {
      console.error("❌ Delete failed:", err);
      if (err.response?.status === 401) {
        setExploreError("Session expired — please log in again");
        setTimeout(() => window.location.href = "/login", 2000);
      } else {
        setExploreError(`Delete failed: ${err.response?.data?.detail || err.message}`);
      }
    }
  };

  // Handler to switch investment mode
  const handleSwitchMode = async () => {
    if (!goalId || !selectedMode) return;

    try {
      setIsSwitchingMode(true);
      const res = await axios.patch(`/goals/${goalId}/mode`, {
        investment_mode: selectedMode,
      });
      setGoal(res.data);
      setShowModeModal(false);
      setSelectedMode(null);
    } catch (err: any) {
      console.error("Mode switch failed:", err);
    } finally {
      setIsSwitchingMode(false);
    }
  };

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

            {/* Tab Switcher */}
            <div className="flex gap-4 border-b border-slate-200">
              <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-3 font-semibold text-sm transition ${
                  activeTab === "overview"
                    ? "text-indigo-600 border-b-2 border-indigo-600"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Overview
              </button>
              {goal.investment_mode !== "autopilot" && (
                <button
                  onClick={() => setActiveTab("explore")}
                  className={`px-4 py-3 font-semibold text-sm transition ${
                    activeTab === "explore"
                      ? "text-indigo-600 border-b-2 border-indigo-600"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Explore
                </button>
              )}
            </div>

            {/* Explore Tab Content */}
            {activeTab === "explore" && (
              <div className="space-y-6">
                {/* Error Banner */}
                {exploreError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-sm font-semibold text-red-700">{exploreError}</p>
                  </div>
                )}

                {/* Search Bar */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Search Funds</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by fund name (e.g., Axis, Vanguard)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                    {isSearching && <p className="text-xs text-slate-400 mt-2">Searching...</p>}

                    {/* Search Results Dropdown */}
                    {searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
                        {searchResults.map((fund) => (
                          <button
                            key={fund.scheme_code}
                            onClick={() => handleSelectFund(fund)}
                            className="w-full px-4 py-3 text-left hover:bg-slate-50 border-b border-slate-100 last:border-b-0 transition"
                          >
                            <p className="font-semibold text-slate-900">{fund.scheme_name}</p>
                            <p className="text-xs text-slate-500">Code: {fund.scheme_code}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fund Details and Investment */}
                {selectedFund && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-start justify-between gap-4 mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-slate-900">{selectedFund.scheme_name}</h3>
                        <span className="inline-flex rounded-full bg-indigo-100 px-3 py-1 text-sm font-semibold text-indigo-700 mt-2">
                          {selectedFund.category}
                        </span>
                      </div>
                      <button
                        onClick={() => setSelectedFund(null)}
                        className="text-slate-400 hover:text-slate-600 text-2xl"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm font-semibold text-slate-600 mb-1">Current NAV</p>
                        <p className="text-2xl font-bold text-slate-900">₹{selectedFund.current_nav?.toFixed(2) || "N/A"}</p>
                      </div>
                      <div className="bg-slate-50 rounded-lg p-4">
                        <p className="text-sm font-semibold text-slate-600 mb-1">Last Updated</p>
                        <p className="text-sm text-slate-700">{new Date(selectedFund.last_updated || Date.now()).toLocaleDateString()}</p>
                      </div>
                    </div>

                    {/* Investment Amount Input */}
                    <div className="mb-6">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Investment Amount (₹)</label>
                      <input
                        type="number"
                        placeholder="Enter amount to invest"
                        value={investAmount}
                        onChange={(e) => setInvestAmount(e.target.value)}
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {investAmount && (
                        <p className="text-xs text-slate-500 mt-2">
                          Estimated units: {(parseFloat(investAmount) / (selectedFund.current_nav || 1)).toFixed(2)}
                        </p>
                      )}
                    </div>

                    <button
                      onClick={handleInvest}
                      disabled={!investAmount}
                      className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition"
                    >
                      Invest Now
                    </button>
                  </div>
                )}

                {/* Holdings List */}
                {investments && investments.holdings && investments.holdings.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h3 className="text-xl font-bold text-slate-900 mb-4">Your Holdings</h3>

                    {/* Summary Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Total Invested</p>
                        <p className="text-xl font-bold text-blue-900">
                          {currency.format(investments.total_invested)}
                        </p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-4">
                        <p className="text-xs font-semibold text-blue-600 uppercase mb-1">Current Value</p>
                        <p className="text-xl font-bold text-blue-900">
                          {currency.format(investments.total_current_value)}
                        </p>
                      </div>
                      <div className={`rounded-lg p-4 ${investments.overall_return_percentage >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                        <p className={`text-xs font-semibold uppercase mb-1 ${investments.overall_return_percentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                          Overall Return
                        </p>
                        <p className={`text-xl font-bold ${investments.overall_return_percentage >= 0 ? "text-green-900" : "text-red-900"}`}>
                          {investments.overall_return_percentage >= 0 ? "+" : ""}
                          {investments.overall_return_percentage.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {/* Holdings Cards */}
                    <div className="space-y-3">
                      {investments.holdings.map((holding) => (
                        <div key={holding.id} className="border border-slate-200 rounded-lg p-4 hover:bg-slate-50 transition">
                          <div className="flex items-start justify-between gap-4 mb-3">
                            <div>
                              <p className="font-semibold text-slate-900">{holding.scheme_name}</p>
                              <p className="text-xs text-slate-500 mt-1">{holding.units?.toFixed(2)} units</p>
                            </div>
                            <button
                              onClick={() => handleDeleteHolding(holding.id)}
                              className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-sm font-semibold transition"
                            >
                              Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-4 gap-2">
                            <div className="bg-slate-50 rounded p-2">
                              <p className="text-[10px] font-semibold text-slate-600 uppercase">Invested</p>
                              <p className="text-sm font-bold text-slate-900">
                                {currency.format(holding.invested_amount)}
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded p-2">
                              <p className="text-[10px] font-semibold text-slate-600 uppercase">Current</p>
                              <p className="text-sm font-bold text-slate-900">
                                {currency.format(holding.current_value)}
                              </p>
                            </div>
                            <div className={`rounded p-2 ${holding.return_percentage >= 0 ? "bg-green-50" : "bg-red-50"}`}>
                              <p className={`text-[10px] font-semibold uppercase ${holding.return_percentage >= 0 ? "text-green-600" : "text-red-600"}`}>
                                Return
                              </p>
                              <p className={`text-sm font-bold ${holding.return_percentage >= 0 ? "text-green-700" : "text-red-700"}`}>
                                {holding.return_percentage >= 0 ? "+" : ""}
                                {holding.return_percentage.toFixed(2)}%
                              </p>
                            </div>
                            <div className="bg-slate-50 rounded p-2">
                              <p className="text-[10px] font-semibold text-slate-600 uppercase">NAV</p>
                              <p className="text-sm font-bold text-slate-900">₹{holding.average_nav?.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty Holdings State */}
                {investments && investments.holdings && investments.holdings.length === 0 && (
                  <div className="bg-slate-50 rounded-2xl border border-slate-200 p-8 text-center">
                    <p className="text-slate-600 font-semibold mb-3">No holdings yet</p>
                    <p className="text-slate-500 text-sm">Search for a fund above and invest to get started!</p>
                  </div>
                )}
              </div>
            )}

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
                    <div className="mt-4 pt-4 border-t border-blue-200">
                      <p className="text-xs font-semibold text-blue-700 mb-2">Want to explore funds manually?</p>
                      <button className="px-4 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg font-semibold text-sm transition">
                        Switch to Manual Mode
                      </button>
                    </div>
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
              {goal.investment_mode === "autopilot" && (
                <button
                  onClick={() => setShowModeModal(true)}
                  className="block w-full px-4 py-3 bg-indigo-100 hover:bg-indigo-200 text-indigo-700 rounded-lg font-semibold text-sm transition"
                >
                  Switch to Manual/Co-pilot Mode for Explore →
                </button>
              )}
              <Link
                href="/goals"
                className="block px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold text-center transition"
              >
                ← Back to goals
              </Link>
            </div>
          </div>
        </main>

        {/* Mode Switch Modal */}
        {showModeModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-slate-900 mb-4">Switch Investment Mode</h2>
              <p className="text-slate-600 mb-6">Select a new investment mode to unlock the Explore feature and take control of your investments.</p>

              <div className="space-y-3 mb-6">
                <button
                  onClick={() => setSelectedMode("copilot")}
                  className={`w-full p-4 text-left rounded-lg border-2 transition ${
                    selectedMode === "copilot"
                      ? "border-purple-500 bg-purple-50"
                      : "border-slate-200 hover:border-purple-300"
                  }`}
                >
                  <p className="font-semibold text-slate-900">Co-pilot Mode</p>
                  <p className="text-sm text-slate-600">I decide, system executes</p>
                </button>

                <button
                  onClick={() => setSelectedMode("manual")}
                  className={`w-full p-4 text-left rounded-lg border-2 transition ${
                    selectedMode === "manual"
                      ? "border-amber-500 bg-amber-50"
                      : "border-slate-200 hover:border-amber-300"
                  }`}
                >
                  <p className="font-semibold text-slate-900">Manual Mode</p>
                  <p className="text-sm text-slate-600">I manage everything</p>
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowModeModal(false);
                    setSelectedMode(null);
                  }}
                  className="flex-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSwitchMode}
                  disabled={!selectedMode || isSwitchingMode}
                  className="flex-1 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg font-semibold transition"
                >
                  {isSwitchingMode ? "Switching..." : "Switch Mode"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
