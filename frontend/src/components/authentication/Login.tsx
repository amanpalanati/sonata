import React from "react";
import { useNavigate } from "react-router-dom";

import { LoginFormData } from "../../types";
import { authService } from "../../services/auth";
import { useAuth } from "../../contexts/AuthContext";

import Header from "./Header";
import LoginForm from "../forms/LoginForm";

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

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

  // Authentication check is now handled at the route level in App.tsx
  return (
    <>
      <Header />
      <LoginForm onSubmit={handleSubmit} />
    </>
  );
};

export default Login;
