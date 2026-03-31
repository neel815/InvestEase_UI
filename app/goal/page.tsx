"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import { isAxiosError } from "axios";
import axios from "@/lib/axios";

type Step = 1 | 2 | 3 | 4;

export default function GoalPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [goalData, setGoalData] = useState({
    goalType: "",
    targetAmount: "",
    targetDate: "",
    investmentMode: "",
  });

  const goalTypes = [
    { id: "retirement", label: "Retirement" },
    { id: "house", label: "House" },
    { id: "education", label: "Education" },
    { id: "wealth", label: "Wealth" },
  ];

  const investmentModes = [
    { id: "autopilot", label: "Autopilot", description: "System manages everything" },
    { id: "copilot", label: "Co-pilot", description: "I decide, system executes" },
    { id: "manual", label: "Manual", description: "I manage everything" },
  ];

  const handleGoalTypeSelect = (typeId: string) => {
    setGoalData((prev) => ({ ...prev, goalType: typeId }));
  };

  const handleInvestmentModeSelect = (modeId: string) => {
    setGoalData((prev) => ({ ...prev, investmentMode: modeId }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setGoalData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    setError(null);

    // Validate current step
    if (currentStep === 1 && !goalData.goalType) {
      setError("Please select a goal type");
      return;
    }
    if (currentStep === 2) {
      if (!goalData.targetAmount || !goalData.targetDate) {
        setError("Please enter both target amount and date");
        return;
      }
      if (parseFloat(goalData.targetAmount) <= 0) {
        setError("Target amount must be greater than 0");
        return;
      }
    }
    if (currentStep === 3 && !goalData.investmentMode) {
      setError("Please select an investment mode");
      return;
    }

    if (currentStep < 4) {
      setCurrentStep((currentStep + 1) as Step);
    }
  };

  const handleBack = () => {
    setError(null);
    if (currentStep > 1) {
      setCurrentStep((currentStep - 1) as Step);
    }
  };

  const handleSubmit = async () => {
    setError(null);
    setIsSubmitting(true);

    try {
      const response = await axios.post<{ id: string }>("/goals", {
        goal_type: goalData.goalType,
        target_amount: parseFloat(goalData.targetAmount),
        target_date: goalData.targetDate,
        investment_mode: goalData.investmentMode,
      });

      router.push(`/sip-plan/${response.data.id}`);
    } catch (err: unknown) {
      const message =
        isAxiosError<{ detail?: string }>(err) &&
        typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : "Failed to create goal";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50 py-14 px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-slate-900 mb-3">Create Your Investment Goal</h1>
            <p className="text-slate-500 text-lg font-medium">Follow these 4 simple steps to get started</p>
          </div>

          {/* Progress Indicator */}
          <div className="mb-10">
            <div className="flex gap-3">
              {[1, 2, 3, 4].map((step) => (
                <div key={step} className="flex-1">
                  <div
                    className={`h-2 rounded-full transition-all duration-500 ${
                      step <= currentStep
                        ? "bg-indigo-600"
                        : "bg-slate-200"
                    }`}
                  />
                </div>
              ))}
            </div>
            <p className="text-center text-sm font-semibold text-slate-500 mt-5">
              Step {currentStep} of 4
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 p-5 rounded-xl">
              <p className="text-sm font-semibold text-red-600">{error}</p>
            </div>
          )}

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-10 mb-8">

          {/* Step 1: Goal Type */}
          {currentStep === 1 && (
            <div className="space-y-10">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                  What&apos;s your investment goal?
                </h2>
                <p className="text-slate-500 text-base font-medium">Select the goal that aligns with your future</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {goalTypes.map((type) => {
                  return (
                    <button
                      key={type.id}
                      onClick={() => handleGoalTypeSelect(type.id)}
                      className={`p-8 rounded-2xl border-2 text-center transition duration-300 ${
                        goalData.goalType === type.id
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-200 bg-white hover:border-indigo-300"
                      }`}
                    >
                      <p className="text-2xl font-bold text-slate-900">{type.label}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 2: Target Amount & Date */}
          {currentStep === 2 && (
            <div className="space-y-10">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                  Set your target
                </h2>
                <p className="text-slate-500 text-base font-medium">How much and by when?</p>
              </div>

              <div className="space-y-7">
                <div>
                  <label htmlFor="targetAmount" className="block text-sm font-semibold text-slate-700 mb-4">
                    Target Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-4 text-slate-400 font-bold text-lg">₹</span>
                    <input
                      type="number"
                      id="targetAmount"
                      name="targetAmount"
                      placeholder="100,000"
                      value={goalData.targetAmount}
                      onChange={handleInputChange}
                      className="w-full pl-10 pr-4 py-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition text-slate-700 placeholder:text-slate-400 text-lg font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="targetDate" className="block text-sm font-semibold text-slate-700 mb-4">
                    Target Date
                  </label>
                  <input
                    type="date"
                    id="targetDate"
                    name="targetDate"
                    value={goalData.targetDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-4 bg-white border border-slate-300 rounded-xl focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition text-slate-700 text-lg font-semibold"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Investment Mode */}
          {currentStep === 3 && (
            <div className="space-y-10">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                  How do you want to invest?
                </h2>
                <p className="text-slate-500 text-base font-medium">Choose your investment style</p>
              </div>

              <div className="grid grid-cols-1 gap-6">
                {investmentModes.map((mode) => {
                  return (
                    <button
                      key={mode.id}
                      onClick={() => handleInvestmentModeSelect(mode.id)}
                      className={`p-8 rounded-2xl border-2 text-left transition duration-300 ${
                        goalData.investmentMode === mode.id
                          ? "border-indigo-600 bg-indigo-50"
                          : "border-slate-200 bg-white hover:border-indigo-300"
                      }`}
                    >
                      <div>
                        <p className="text-2xl font-bold text-slate-900">{mode.label}</p>
                        <p className="text-slate-500 text-sm mt-2 font-medium">{mode.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 4: Confirmation */}
          {currentStep === 4 && (
            <div className="space-y-10">
              <div>
                <h2 className="text-3xl font-bold text-slate-900 mb-3">
                  Ready to start investing?
                </h2>
                <p className="text-slate-500 text-base font-medium">Review your goal details below</p>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-10 space-y-8">
                <div className="flex items-center justify-between pb-8 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Goal Type</span>
                  <span className="text-2xl font-bold text-indigo-600 capitalize">
                    {goalTypes.find((t) => t.id === goalData.goalType)?.label}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-8 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Target Amount</span>
                  <span className="text-3xl font-bold text-slate-900">
                    ₹{parseFloat(goalData.targetAmount).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-8 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Target Date</span>
                  <span className="text-xl font-semibold text-slate-700">
                    {new Date(goalData.targetDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-semibold">Investment Mode</span>
                  <span className="text-xl font-semibold text-indigo-600 capitalize">
                    {investmentModes.find((m) => m.id === goalData.investmentMode)?.label}
                  </span>
                </div>
              </div>
            </div>
          )}

          </div>

          {/* Navigation Buttons */}
          <div className="flex gap-4 justify-between">
            <button
              onClick={handleBack}
              disabled={currentStep === 1}
              className="px-8 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl disabled:opacity-30 disabled:cursor-not-allowed font-semibold transition duration-200"
            >
              Back
            </button>

            {currentStep < 4 ? (
              <button
                onClick={handleNext}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold transition duration-200"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl disabled:opacity-50 font-semibold transition duration-200"
              >
                {isSubmitting ? "Creating Goal..." : "Start Investing"}
              </button>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
