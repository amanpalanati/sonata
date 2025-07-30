import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { LoginFormData } from "../../types";
import { useFormFieldManagement } from "../../hooks/useFormFieldManagement";

import FormField from "./FormField";
import RootMessage from "./RootMessage";
import GoogleSignIn from "./GoogleSignIn";

import { useBodyClass } from "../../hooks/useBodyClass";
import styles from "../../styles/forms/LoginForm.module.css";

// Validation schema
const loginSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .trim(),
  password: yup.string().required("Password is required"),
});

interface LoginFormProps {
  onSubmit?: (data: LoginFormData) => void | Promise<void>;
}

const LogInForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  useBodyClass("auth");
  const navigate = useNavigate();
  const location = useLocation();

  const form = useForm<LoginFormData>({ resolver: yupResolver(loginSchema) });
  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    setValue,
    clearErrors,
  } = form;

  // Use the custom hook for field management
  const { customRegister } = useFormFieldManagement({
    form,
    onFocus: () => {
      // Clear success message when any input gets focus
      if (successMessage) {
        setSuccessMessage("");
      }
    },
  });

  // Track success messages from location state
  const [successMessage, setSuccessMessage] = React.useState<string>("");

  // Handle OAuth errors and success messages from location state
  React.useEffect(() => {
    const state = location.state as {
      oauthError?: string;
      successMessage?: string;
    } | null;

    if (state?.oauthError) {
      setError("root", {
        type: "manual",
        message: state.oauthError,
      });
      // Clear the state to prevent showing error again on re-render
      navigate(location.pathname, { replace: true, state: {} });
    }

    if (state?.successMessage) {
      setSuccessMessage(state.successMessage);
      // Clear the state to prevent showing message again on re-render
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, setError, navigate, location.pathname]);

  const handleFormSubmit = async (data: LoginFormData) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Default logic when no onSubmit function is provided
        navigate("/dashboard");
      }
    } catch (error) {
      // Clear password field on API errors while keeping email field
      setValue("password", "");

      // Handle API errors
      if (error instanceof Error) {
        setError("root", { type: "manual", message: error.message });
      } else {
        setError("root", {
          type: "manual",
          message: "An unexpected error occurred. Please try again.",
        });
      }
    }
  };

  return (
    <>
      <div className={styles.wrapper}></div>
      <div className={styles.container}>
        <h1 className={styles.h1}>Log In</h1>

        <form
          className={styles.form}
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
        >
          {/* Success message */}
          <RootMessage
            message={successMessage}
            type="success"
            styles={{
              success: styles.success,
            }}
            showIcon={false}
          />

          {/* Root error for API errors */}
          <RootMessage
            message={errors.root?.message}
            type="error"
            styles={{
              alert: styles.alert,
              span: styles.span,
            }}
          />

          {/* Form Fields */}
          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="Email"
            register={customRegister("email")}
            error={errors.email}
            styles={styles}
          />

          <FormField
            id="password"
            label="Password"
            type="password"
            placeholder="Password"
            register={customRegister("password")}
            error={errors.password}
            styles={styles}
          />

          <button
            className={styles.submitButton}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Logging In..." : "Log In"}
          </button>
        </form>

        <Link to="/forgot-password" className={styles.forgotPassword}>
          Forgot your password?
        </Link>

        <div className={styles.divider}>
          <span className={styles.dividerSpan}>OR</span>
        </div>

        <GoogleSignIn
          text="in"
          mode="login"
          onError={(message) => setError("root", { type: "manual", message })}
          onFocus={() => clearErrors("root")}
        />

        <p className={styles.p}>
          Don't have an account?
          <Link to="/signup" className={styles.link}>
            Sign Up
          </Link>
        </p>
      </div>
    </>
  );
};

export default LogInForm;
