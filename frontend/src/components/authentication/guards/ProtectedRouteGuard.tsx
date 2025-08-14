import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useRef } from "react";

import { useAuth } from "../../../contexts/AuthContext";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading, isLoggingOut, checkAuth } = useAuth();
  const location = useLocation();
  const previousPath = useRef<string>("");

  // Check auth only when navigating to a different protected route (not on hash changes or same route)
  useEffect(() => {
    const currentPath = location.pathname;

    // Only check auth if:
    // 1. Not loading or logging out
    // 2. The pathname actually changed (not just hash or search params)
    // 3. This isn't the initial load (previousPath has been set)
    if (
      !loading &&
      !isLoggingOut &&
      previousPath.current &&
      previousPath.current !== currentPath
    ) {
      checkAuth();
    }

    previousPath.current = currentPath;
  }, [location.pathname, checkAuth, loading, isLoggingOut]);

  if (loading || isLoggingOut) {
    return <></>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
