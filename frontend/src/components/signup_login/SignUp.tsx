import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { SignUpFormData } from "../../types";
import { authService } from "../../services/auth";
import { useAuth } from "../../hooks/useAuth";

import Header from "./Header";
import SignUpForm from "../forms/SignUpForm";

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleSubmit = async (data: SignUpFormData): Promise<void> => {
    try {
      const result = await authService.signup(data);

      if (result.success) {
        // Update auth state
        login(result.user);
        // Redirect to dashboard after successful signup
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

  // Don't render signup if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <Header />
      <SignUpForm onSubmit={handleSubmit} />
    </>
  );
};

export default SignUp;
