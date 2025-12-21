import { useState, useEffect, useCallback, useMemo } from "react";

export interface User {
  id: number;
  name: string | null;
  email: string | null;
  role: "admin" | "manager" | "viewer";
  createdAt?: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
}

type UseAuthOptions = {
  redirectOnUnauthenticated?: boolean;
  redirectPath?: string;
};

export function useAuth(options?: UseAuthOptions) {
  const { redirectOnUnauthenticated = false, redirectPath = "/login" } = options ?? {};
  
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
    error: null,
  });

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));
      
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem("manus-runtime-user-info", JSON.stringify(data.user));
        setState({
          user: data.user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
      } else {
        localStorage.removeItem("manus-runtime-user-info");
        setState({
          user: null,
          loading: false,
          isAuthenticated: false,
          error: null,
        });
      }
    } catch (error) {
      localStorage.removeItem("manus-runtime-user-info");
      setState({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: error instanceof Error ? error : new Error("Failed to check authentication"),
      });
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!redirectOnUnauthenticated) return;
    if (state.loading) return;
    if (state.user) return;
    if (typeof window === "undefined") return;
    if (window.location.pathname === redirectPath) return;
    if (window.location.pathname === "/login") return;
    if (window.location.pathname === "/register") return;

    window.location.href = redirectPath;
  }, [redirectOnUnauthenticated, redirectPath, state.loading, state.user]);

  const login = useCallback(async (data: LoginData) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("manus-runtime-user-info", JSON.stringify(result.user));
        setState({
          user: result.user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: new Error(result.error || "Login failed"),
        }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed";
      setState(prev => ({
        ...prev,
        loading: false,
        error: new Error(errorMessage),
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        localStorage.setItem("manus-runtime-user-info", JSON.stringify(result.user));
        setState({
          user: result.user,
          loading: false,
          isAuthenticated: true,
          error: null,
        });
        return { success: true };
      } else {
        setState(prev => ({
          ...prev,
          loading: false,
          error: new Error(result.error || "Registration failed"),
        }));
        return { success: false, error: result.error };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed";
      setState(prev => ({
        ...prev,
        loading: false,
        error: new Error(errorMessage),
      }));
      return { success: false, error: errorMessage };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });

      localStorage.removeItem("manus-runtime-user-info");
      setState({
        user: null,
        loading: false,
        isAuthenticated: false,
        error: null,
      });

      // Redirect to home page
      window.location.href = "/";
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  const updateProfile = useCallback(async (data: { name?: string }) => {
    try {
      const response = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      if (response.ok) {
        await checkAuth();
        return { success: true };
      } else {
        const result = await response.json();
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: "Failed to update profile" };
    }
  }, [checkAuth]);

  const changePassword = useCallback(async (data: { currentPassword: string; newPassword: string }) => {
    try {
      const response = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        return { success: true };
      } else {
        return { success: false, error: result.error };
      }
    } catch (error) {
      return { success: false, error: "Failed to change password" };
    }
  }, []);

  return {
    ...state,
    login,
    register,
    logout,
    refresh: checkAuth,
    updateProfile,
    changePassword,
    isAdmin: state.user?.role === "admin",
  };
}

// Helper hook for protected routes
export function useRequireAuth(redirectTo: string = "/login") {
  return useAuth({ redirectOnUnauthenticated: true, redirectPath: redirectTo });
}

// Helper hook for admin-only routes
export function useRequireAdmin(redirectTo: string = "/dashboard") {
  const auth = useRequireAuth();

  useEffect(() => {
    if (!auth.loading && auth.isAuthenticated && auth.user?.role !== "admin") {
      window.location.href = redirectTo;
    }
  }, [auth.loading, auth.isAuthenticated, auth.user?.role, redirectTo]);

  return auth;
}
