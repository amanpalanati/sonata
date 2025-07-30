import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { authService } from "../../services/auth";
import { useFormFieldManagement } from "../../hooks/useFormFieldManagement";

import FormField from "./fields/FormField";
import RootMessage from "./fields/RootMessage";
import Header from "../authentication/Header";

import { useBodyClass } from "../../hooks/useBodyClass";
import styles from "../../styles/forms/ForgotPassword.module.css";

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

  const form = useForm<ResetPasswordFormData>({
    resolver: yupResolver(schema),
  });

  const {
    handleSubmit,
    formState: { errors },
  } = form;

  // Use the custom hook for field management
  const { customRegister } = useFormFieldManagement({
    form,
    passwordField: "password",
    confirmPasswordField: "confirmPassword",
    onFocus: () => {
      // Clear API error when any input gets focus
      setError(null);
    },
  });

  useEffect(() => {
    // Check for error in hash fragment first
    const hash = window.location.hash.substring(1); // Remove the # symbol
    const hashParams = new URLSearchParams(hash);

    const hashError = hashParams.get("error");
    const errorCode = hashParams.get("error_code");

    if (hashError) {
      if (errorCode === "otp_expired") {
        setError(
          "The password reset link has expired. Please request a new link."
        );
      } else if (hashError === "access_denied") {
        setError(
          "Access denied. The password reset link may be invalid or expired. Please request a new password reset."
        );
      } else {
        setError(
          "The password reset link has expired.\nPlease request a new link."
        );
      }
      return;
    }

    // Extract access token from URL parameters (query string)
    const token =
      searchParams.get("access_token") ||
      searchParams.get("token") ||
      searchParams.get("recovery_token");

    // Also check hash fragment for tokens
    const hashToken =
      hashParams.get("access_token") ||
      hashParams.get("token") ||
      hashParams.get("recovery_token");

    const finalToken = token || hashToken;

    if (!finalToken) {
      setError(
        "Invalid or missing reset token. Please request a new password reset."
      );
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
        access_token: accessToken,
      });

      if (result.success) {
        navigate("/login", {
          state: {
            successMessage:
              "Your password has been reset. Please log in with your new password.",
          },
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

          <p className={styles.emoji}>⚠️</p>

          <p className={styles.invalidLinkAlert}>{error}</p>

          <Link className={styles.back} to="/forgot-password">
            Request New Reset Link
          </Link>
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
          <RootMessage
            message={error || undefined}
            type="error"
            styles={{
              alert: styles.resetTokenAlert,
              span: styles.span,
            }}
          />

          <FormField
            id="password"
            label="New Password"
            type="password"
            placeholder="New Password"
            register={customRegister("password")}
            error={errors.password}
            styles={styles}
            className={styles.resetFirstFormGroup}
          />

          <FormField
            id="confirmPassword"
            label="Confirm New Password"
            type="password"
            placeholder="Confirm New Password"
            register={customRegister("confirmPassword")}
            error={errors.confirmPassword}
            styles={styles}
          />

          <button
            className={styles.submitButton}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        <div className={styles.links}>
          <Link to="/login" className={styles.link}>
            Back to Login
          </Link>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
