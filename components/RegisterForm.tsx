"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import axios from "@/lib/axios";

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Basic validation
      if (!formData.full_name || !formData.email || !formData.password) {
        throw new Error("All fields are required");
      }

      if (formData.password !== formData.confirmPassword) {
        throw new Error("Passwords don't match");
      }

      if (formData.password.length < 8) {
        throw new Error("Password must be at least 8 characters");
      }

      // Register
      await axios.post("/auth/register", {
        email: formData.email,
        password: formData.password,
        full_name: formData.full_name,
      });

      // Redirect to login
      router.push("/login");
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An error occurred";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8 w-full">
      {error && (
        <div className="bg-red-50 border border-red-200 p-4 rounded-xl">
          <p className="text-sm font-semibold text-red-600">{error}</p>
        </div>
      )}

      <div className="space-y-3">
        <label htmlFor="full_name" className="block text-sm font-semibold text-slate-700">
          Full Name
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          placeholder="John Doe"
          value={formData.full_name}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
        />
      </div>

      <div className="space-y-3">
        <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          placeholder="At least 8 characters"
          value={formData.password}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
        />
        {formData.password && formData.password.length < 8 && (
          <p className="text-xs font-medium text-red-600">Minimum 8 characters required</p>
        )}
      </div>

      <div className="space-y-3">
        <label htmlFor="confirmPassword" className="block text-sm font-semibold text-slate-700">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          placeholder="Repeat your password"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-white border border-slate-300 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 transition duration-200"
        />
        {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
          <p className="text-xs font-medium text-red-600">Passwords do not match</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
      >
        {isLoading ? "Creating account..." : "Create Account"}
      </button>

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-slate-500">already have account</span>
        </div>
      </div>

      <Link
        href="/login"
        className="w-full block text-center py-3 px-4 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 font-semibold transition duration-200"
      >
        Sign In
      </Link>
    </form>
  );
}
