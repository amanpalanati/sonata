import React, { useState } from "react";

import { authService } from "../../services/auth";
import { useAuth } from "../../contexts/AuthContext";

const Dashboard: React.FC = () => {
  const { logoutAndRedirect, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    setIsLoggingOut(true);

    try {
      // Clear backend session first
      await authService.logout();

      // Use the context method that handles redirect properly
      logoutAndRedirect("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if backend logout fails, still redirect
      logoutAndRedirect("/");
    }
  };

  // Authentication is now handled at the route level in App.tsx
  return (
    <>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.first_name}!</p>
      <button onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? "Logging out..." : "Log Out"}
      </button>
    </>
  );
};

export default Dashboard;
