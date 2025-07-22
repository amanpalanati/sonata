import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { LoginFormData } from "../../types";
import { authService } from "../../services/auth";
import { useAuth } from "../../hooks/useAuth";

import Header from "./Header";
import LoginForm from "../forms/LoginForm";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (data: LoginFormData): Promise<void> => {
    try {
      const result = await authService.login(data);

      if (result.success) {
        // Update auth state
        login(result.user);
        // Redirect to dashboard after successful login
        navigate("/dashboard");
      }
    } catch (error) {
      // Error will be handled by the form component
      throw error;
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return <></>;
  }

  // Don't render login if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header />
      <LoginForm onSubmit={handleSubmit} />
    </>
  );
};

export default Login;
