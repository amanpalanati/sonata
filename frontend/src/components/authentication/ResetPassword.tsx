import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { useBodyClass } from "../../hooks/useBodyClass";
import { authService } from "../../services/auth";
import FloatingLabelInput from "../forms/FloatingLabelInput";
import Header from "./Header";
import styles from "../../styles/forms/LoginForm.module.css";

interface ResetPasswordFormData {
  password: string;
  confirmPassword: string;
}

const schema = yup.object().shape({
  password: yup
    .string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref("password")], "Passwords must match")
    .required("Please confirm your password"),
});

const ResetPassword: React.FC = () => {
  useBodyClass("auth");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  
  // Track which fields have been blurred and had errors
  const [touchedWithErrors, setTouchedWithErrors] = useState<Set<string>>(
    new Set()
  );

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    clearErrors,
  } = useForm<ResetPasswordFormData>({
    resolver: yupResolver(schema),
  });

  // Watch for error changes and add fields to touchedWithErrors
  useEffect(() => {
    const fieldNames: (keyof ResetPasswordFormData)[] = ['password', 'confirmPassword'];
    fieldNames.forEach(fieldName => {
      if (errors[fieldName]) {
        setTouchedWithErrors((prev) => new Set(prev).add(fieldName));
      }
    });
  }, [errors]);

  // Custom register function that adds onChange validation for fields with errors
  const customRegister = (name: keyof ResetPasswordFormData) => {
    const registration = register(name);

    return {
      ...registration,
      onChange: async (e: React.ChangeEvent<HTMLInputElement>) => {
        registration.onChange(e);
        // If this field has had an error before, validate on change
        if (touchedWithErrors.has(name)) {
          await trigger(name);
        }
      },
      onFocus: () => {
        // Clear API error when any input gets focus
        setError(null);
      },
      onBlur: async (e: React.FocusEvent<HTMLInputElement>) => {
        registration.onBlur(e);
        // Always validate on blur
        await trigger(name);
        // Check for errors after validation and add to touchedWithErrors if there are any
        // Use setTimeout to ensure the error state is updated
        setTimeout(() => {
          if (errors[name]) {
            setTouchedWithErrors((prev) => new Set(prev).add(name));
          }
        }, 0);
      },
    };
  };

  useEffect(() => {
    // Check for error in hash fragment first
    const hash = window.location.hash.substring(1); // Remove the # symbol
    const hashParams = new URLSearchParams(hash);
    
    const hashError = hashParams.get('error');
    const errorCode = hashParams.get('error_code');
    
    if (hashError) {
      if (errorCode === 'otp_expired') {
        setError("The password reset link has expired. Please request a new password reset.");
      } else if (hashError === 'access_denied') {
        setError("Access denied. The password reset link may be invalid or expired. Please request a new password reset.");
      } else {
        setError("The password reset link is invalid. Please request a new password reset.");
      }
      return;
    }
    
    // Extract access token from URL parameters (query string)
    const token = searchParams.get('access_token') || 
                  searchParams.get('token') || 
                  searchParams.get('recovery_token');
    
    // Also check hash fragment for tokens
    const hashToken = hashParams.get('access_token') || 
                      hashParams.get('token') || 
                      hashParams.get('recovery_token');
    
    const finalToken = token || hashToken;
    
    if (!finalToken) {
      setError("Invalid or missing reset token. Please request a new password reset.");
      return;
    }
    
    setAccessToken(finalToken);
  }, [searchParams]);

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!accessToken) {
      setError("Invalid reset token. Please request a new password reset.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await authService.resetPasswordWithToken({
        newPassword: data.password,
        confirmNewPassword: data.confirmPassword,
        access_token: accessToken
      });

      if (result.success) {
        navigate("/login", {
          state: {
            successMessage: "Password reset successfully! Please log in with your new password."
          }
        });
      }
    } catch (error: any) {
      setError(error.message || "Failed to reset password. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (error && !accessToken) {
    return (
      <>
        <Header />
        <div className={styles.wrapper}></div>
        <div className={styles.container}>
          <h1 className={styles.h1}>Reset Password</h1>
          
          <div style={{ 
            textAlign: 'center', 
            padding: '2rem 0',
            fontSize: '16px',
            lineHeight: '1.5'
          }}>
            <div style={{ 
              fontSize: '48px', 
              marginBottom: '1rem',
              color: '#dc3545'
            }}>
              ⚠️
            </div>
            
            <p style={{ marginBottom: '2rem', color: '#dc3545' }}>
              {error}
            </p>
          </div>

          <button
            className={styles.submitButton}
            type="button"
            onClick={() => navigate("/forgot-password")}
          >
            Request New Reset Link
          </button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className={styles.wrapper}></div>
      <div className={styles.container}>
        <h1 className={styles.h1}>Reset Your Password</h1>
        
        <form onSubmit={handleSubmit(onSubmit)} className={styles.form}>
          {error && (
            <div className={styles.alert}>
              <span className={styles.span}>&#9888;</span>
              {error}
            </div>
          )}

          <div className={styles.formGroup}>
            <FloatingLabelInput
              id="password"
              label="New Password"
              type="password"
              register={customRegister("password")}
              errors={errors.password}
              ariaInvalid={errors.password ? "true" : "false"}
            />
            {errors.password && (
              <div className={styles.error}>
                <span className={styles.span}>&#9888;</span>
                {errors.password.message}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <FloatingLabelInput
              id="confirmPassword"
              label="Confirm New Password"
              type="password"
              register={customRegister("confirmPassword")}
              errors={errors.confirmPassword}
              ariaInvalid={errors.confirmPassword ? "true" : "false"}
            />
            {errors.confirmPassword && (
              <div className={styles.error}>
                <span className={styles.span}>&#9888;</span>
                {errors.confirmPassword.message}
              </div>
            )}
          </div>

          <button
            className={styles.submitButton}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        <div className={styles.links}>
          <button
            type="button"
            className={styles.linkButton}
            onClick={() => navigate("/login")}
          >
            Back to Login
          </button>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
