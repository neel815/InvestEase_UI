import axios from "axios";

const instance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
});

// Request interceptor to add token to headers
instance.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log("📤 [Axios] Token attached to request:", {
          url: config.url,
          method: config.method,
          tokenPresent: !!token,
          baseURL: config.baseURL,
        });
      } else {
        console.warn("⚠️ [Axios] No token found in localStorage for request:", config.url);
      }
    }
    return config;
  },
  (error) => {
    console.error("❌ [Axios] Request interceptor error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
instance.interceptors.response.use(
  (response) => {
    console.log("✅ [Axios] Response received:", {
      url: response.config.url,
      status: response.status,
      dataLength: JSON.stringify(response.data).length,
    });
    return response;
  },
  (error: any) => {
    // Comprehensive error logging for all error types
    const errorInfo = {
      url: error.config?.url || "unknown",
      method: error.config?.method || "unknown",
      status: error.response?.status || null,
      statusText: error.response?.statusText || null,
      message: error.message || "Unknown error",
      data: error.response?.data || null,
      code: error.code || null,
      isNetworkError: !error.response,
    };

    console.error("❌ [Axios] Response error:", errorInfo);

    // Log full error object if needed
    if (error.isNetworkError) {
      console.error("🌐 Network Error - Backend may be down:", {
        message: error.message,
        code: error.code,
      });
    }

    if (error.response?.status === 401 && typeof window !== "undefined") {
      console.warn("🔐 [Axios] 401 Unauthorized - clearing token and redirecting to login");
      // Clear token from localStorage
      localStorage.removeItem("token");
      
      // Dispatch unauthorized event to AuthContext
      window.dispatchEvent(new Event("unauthorized"));
      
      // Redirect to login
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default instance;
