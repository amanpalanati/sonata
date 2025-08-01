import React from "react";
import { useNavigate } from "react-router-dom";

import { SignUpFormData } from "../../types";
import { authService } from "../../services/auth";
import { useAuth } from "../../contexts/AuthContext";

import Header from "./Header";
import SignUpForm from "../forms/SignUpForm";

const SignUp: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (data: SignUpFormData): Promise<void> => {
    try {
      const result = await authService.signup(data);

      if (result.success) {
        // Update auth state
        login(result.user);

        // Redirect based on profile completion status
        if (result.user.profile_completed) {
          navigate("/dashboard");
        } else {
          navigate("/complete-profile");
        }
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
      <SignUpForm onSubmit={handleSubmit} />
    </>
  );
};

export default SignUp;
