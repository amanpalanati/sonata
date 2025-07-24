import { SignUpFormData, LoginFormData } from "../types";
import { supabase } from "./supabase";

// Since we have a proxy configured in vite.config.ts, we can use relative URLs
// The proxy will forward /api requests to http://localhost:5000
const API_BASE_URL = "";

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  const data = await response.json();

  if (!response.ok) {
    // Check if session was cleared due to deleted user
    if (data.session_cleared) {
      // This will be handled by the calling code to update auth state
      const error = new Error(data.error || "Session expired");
      (error as any).sessionCleared = true;
      throw error;
    }
    throw new Error(data.error || "An unexpected error occurred");
  }

  return data;
};

// API service for authentication
export const authService = {
  // Sign up a new user
  signup: async (formData: SignUpFormData) => {
    const response = await fetch(`${API_BASE_URL}/api/signup`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include", // Include cookies for session management
      body: JSON.stringify(formData),
    });

    return handleResponse(response);
  },

  // Log in a user
  login: async (formData: LoginFormData) => {
    const response = await fetch(`${API_BASE_URL}/api/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(formData),
    });

    return handleResponse(response);
  },

  // Log out a user
  logout: async () => {
    try {
      // First, sign out from Supabase to clear the OAuth session
      await supabase.auth.signOut();
      
      // Then clear the Flask session
      const response = await fetch(`${API_BASE_URL}/api/logout`, {
        method: "POST",
        credentials: "include",
      });

      return handleResponse(response);
    } catch (error) {
      // Even if there's an error, still try to clear local state
      console.error("Logout error:", error);
      return { success: true, message: "Logged out locally" };
    }
  },

  // Get current user data
  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/api/user`, {
      method: "GET",
      credentials: "include",
    });

    return handleResponse(response);
  },

  // Check if user is authenticated
  checkAuth: async () => {
    const response = await fetch(`${API_BASE_URL}/api/check-auth`, {
      method: "GET",
      credentials: "include",
    });

    return handleResponse(response);
  },
};
