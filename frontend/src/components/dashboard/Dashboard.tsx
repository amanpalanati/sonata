import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { authService } from "../../services/auth";
import { useAuth } from "../../hooks/useAuth";

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading, logout } = useAuth();
  const isLoggingOut = useRef(false);

  useEffect(() => {
    // If user is not authenticated and not in the process of logging out, redirect to login
    if (!loading && !isAuthenticated && !isLoggingOut.current) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogout = async () => {
    try {
      isLoggingOut.current = true; // Set flag to prevent useEffect redirect
      await authService.logout();
      logout(); // Update auth state
      navigate("/"); // Redirect to homepage after logout
    } catch (error) {
      console.error("Logout failed:", error);
      isLoggingOut.current = false; // Reset flag on error
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return <></>;
  }

  // Don't render dashboard if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <h1>Dashboard</h1>
      <button onClick={handleLogout}>Log Out</button>
    </>
  );
};

export default Dashboard;
