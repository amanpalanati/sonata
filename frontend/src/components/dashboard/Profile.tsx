import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();
  const isLoggingOut = useRef(false);

  useEffect(() => {
    // If user is not authenticated and not in the process of logging out, redirect to login
    if (!loading && !isAuthenticated && !isLoggingOut.current) {
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return <></>;
  }

  // Don't render profile if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return <h1>Profile</h1>;
};

export default Profile;
