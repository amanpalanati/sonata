import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ForgotPasswordFormData, ForgotPasswordEmailData } from "../../types";
import { authService } from "../../services/auth";

import Header from "./Header";
import ForgotPasswordEmailForm from "../forms/ForgotPasswordEmailForm";
import ForgotPasswordForm from "../forms/ForgotPasswordForm";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'password'>('email');
  const [verifiedEmail, setVerifiedEmail] = useState<string>('');

  const handleEmailSubmit = async (data: ForgotPasswordEmailData): Promise<void> => {
    try {
      const result = await authService.verifyEmailForReset(data);

      if (result.success) {
        setVerifiedEmail(data.email);
        setStep('password');
      }
    } catch (error) {
      // Error will be handled by the form component
      throw error;
    }
  };

  const handlePasswordSubmit = async (data: ForgotPasswordFormData): Promise<void> => {
    try {
      const result = await authService.resetPassword({
        ...data,
        email: verifiedEmail
      });

      if (result.success) {
        // Redirect to login page with success message
        navigate("/login", {
          state: {
            successMessage: "Password reset successfully! Please log in with your new password."
          }
        });
      }
    } catch (error) {
      // Error will be handled by the form component
      throw error;
    }
  };

  return (
    <>
      <Header />
      {step === 'email' ? (
        <ForgotPasswordEmailForm onSubmit={handleEmailSubmit} />
      ) : (
        <ForgotPasswordForm onSubmit={handlePasswordSubmit} />
      )}
    </>
  );
};

export default ForgotPassword;
