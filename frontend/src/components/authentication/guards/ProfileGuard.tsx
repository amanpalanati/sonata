import React from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "../../../contexts/AuthContext";

interface ProfileGuardProps {
  children: React.ReactNode;
}

/**
 * ProfileGuard ensures that authenticated users have completed their profile.
 * If the user's profile is incomplete, they are redirected to the profile completion flow.
 * This component should wrap protected routes that require a complete profile.
 */
const ProfileGuard: React.FC<ProfileGuardProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading while auth check is in progress
  if (loading) {
    return <></>;
  }

  // If user is not authenticated, this should be handled by ProtectedRoute
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if profile is incomplete
  if (!user.profile_completed) {
    return <Navigate to="/complete-profile" replace />;
  }

  // Profile is complete, render the protected content
  return <>{children}</>;
};

export default ProfileGuard;
