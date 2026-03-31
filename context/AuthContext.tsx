"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "@/lib/axios";

interface User {
  id: string;
  email: string;
  full_name: string | null;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    if (storedToken) {
      setToken(storedToken);
    }
    setIsLoading(false);
  }, []);

  // Listen for unauthorized event (triggered by axios interceptor)
  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuthState();
    };

    window.addEventListener("unauthorized", handleUnauthorized);
    return () => window.removeEventListener("unauthorized", handleUnauthorized);
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await axios.post("/auth/login", {
        email,
        password,
      });
      const { access_token } = response.data;
      localStorage.setItem("token", access_token);
      setToken(access_token);
    } catch (error) {
      throw error;
    }
  };

  const clearAuthState = () => {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  };

  const logout = async () => {
    try {
      // Call logout endpoint to blacklist token on server
      await axios.post("/auth/logout");
    } catch (error) {
      // Ignore errors - frontend always cleans up regardless of server state
      console.error("Logout request failed, but clearing local state anyway", error);
    } finally {
      // Always clear local state
      clearAuthState();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
