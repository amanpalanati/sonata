import { Navigate } from "react-router-dom";

import { useAuth } from "../../../contexts/AuthContext";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, loading, isLoggingOut } = useAuth();

  if (loading || isLoggingOut) {
    return <></>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
