"use client";

import { useEffect, useMemo, useState } from "react";

import { isAxiosError } from "axios";

import { DashboardNav } from "@/components/DashboardNav";
import ProtectedRoute from "@/components/ProtectedRoute";
import axios from "@/lib/axios";
import type { Concept } from "@/types";

export default function LearnPage() {
  const [concepts, setConcepts] = useState<Concept[]>([]);
  const [search, setSearch] = useState("");
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const fetchConcepts = async () => {
      setIsLoading(true);
      setHasError(false);

      try {
        const response = await axios.get<Concept[]>("/education/concepts");
        if (!isCancelled) {
          setConcepts(response.data);
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
        }
      }
    };

    fetchConcepts();

    return () => {
      isCancelled = true;
    };
  }, []);

  const filteredConcepts = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return concepts;
    }

    return concepts.filter((concept) => {
      const haystack = `${concept.title} ${concept.summary} ${concept.explanation}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [concepts, search]);

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-slate-50">
        <DashboardNav />

        <main className="ml-64 min-h-screen bg-white py-10 px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Learn Investing Concepts</h1>
              <p className="mt-2 text-slate-500">
                Explore practical investing concepts with simple explanations and worked examples.
              </p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
              <label htmlFor="conceptSearch" className="block text-sm font-semibold text-slate-700 mb-2">
                Search concepts
              </label>
              <input
                id="conceptSearch"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Try: SIP, inflation, diversification"
                className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
              />
            </div>

            {isLoading ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="text-indigo-600 text-3xl mb-3">◌</div>
                <p className="text-slate-500 font-medium">Loading concepts...</p>
              </div>
            ) : hasError ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="text-indigo-600 text-3xl mb-3">◌</div>
                <p className="text-slate-700 font-semibold">Could not load concepts right now.</p>
                <p className="text-slate-400 mt-1">Please refresh and try again.</p>
              </div>
            ) : filteredConcepts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12 text-center">
                <div className="text-indigo-600 text-3xl mb-3">◌</div>
                <p className="text-slate-700 font-semibold">No matching concepts found.</p>
                <p className="text-slate-400 mt-1">Try a different keyword.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredConcepts.map((concept) => (
                  <button
                    key={concept.id}
                    type="button"
                    onClick={() => setSelectedConcept(concept)}
                    className="text-left bg-white rounded-2xl border border-slate-200 shadow-sm p-6 hover:border-indigo-300 hover:shadow-md transition duration-200"
                  >
                    <h2 className="text-xl font-semibold text-slate-900">{concept.title}</h2>
                    <p className="mt-3 text-sm text-slate-500 line-clamp-4">{concept.summary}</p>
                    <p className="mt-5 text-sm font-semibold text-indigo-600">Read full concept</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </main>

        {selectedConcept && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
            <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-xl">
              <div className="px-6 py-5 border-b border-slate-200 flex items-start justify-between gap-3">
                <h3 className="text-2xl font-bold text-slate-900">{selectedConcept.title}</h3>
                <button
                  type="button"
                  onClick={() => setSelectedConcept(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition duration-200"
                >
                  Close
                </button>
              </div>

              <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
                <div>
                  <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide">Full Explanation</p>
                  <p className="mt-2 text-slate-700 leading-7">{selectedConcept.explanation}</p>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-indigo-700 uppercase tracking-wide">Number Example</p>
                  <p className="mt-2 text-indigo-900 leading-7">{selectedConcept.number_example}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
