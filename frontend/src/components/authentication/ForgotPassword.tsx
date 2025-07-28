import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { ForgotPasswordEmailData } from "../../types";
import { authService } from "../../services/auth";

import Header from "./Header";
import ForgotPasswordEmailForm from "../forms/ForgotPasswordEmailForm";
import ForgotPasswordEmailSent from "./ForgotPasswordEmailSent";

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'sent'>('email');
  const [email, setEmail] = useState<string>('');

  const handleEmailSubmit = async (data: ForgotPasswordEmailData): Promise<void> => {
    try {
      const result = await authService.forgotPassword(data);

      if (result.success) {
        setEmail(data.email);
        setStep('sent');
      }
    } catch (error) {
      // Error will be handled by the form component
      throw error;
    }
  };

  const handleBackToLogin = () => {
    navigate("/login");
  };

  return (
    <>
      <Header />
      {step === 'email' ? (
        <ForgotPasswordEmailForm onSubmit={handleEmailSubmit} />
      ) : (
        <ForgotPasswordEmailSent 
          email={email}
          onBackToLogin={handleBackToLogin}
        />
      )}
    </>
  );
};

export default ForgotPassword;
