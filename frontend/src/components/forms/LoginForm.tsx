import React from "react";
import { useForm } from "react-hook-form";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { LoginFormData } from "../../types";

import FloatingLabelInput from "./FloatingLabelInput";
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

  // Track which fields have been blurred and had errors
  const [touchedWithErrors, setTouchedWithErrors] = React.useState<Set<string>>(
    new Set()
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    trigger,
    setValue,
    clearErrors,
  } = useForm<LoginFormData>({ resolver: yupResolver(loginSchema) });

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

  // Effect to track which fields have errors after blur
  React.useEffect(() => {
    Object.keys(errors).forEach((fieldName) => {
      if (fieldName !== "root") {
        setTouchedWithErrors((prev) => new Set(prev).add(fieldName));
      }
    });
  }, [errors]);

  // Custom register function that adds onChange validation for fields with errors
  const customRegister = (name: keyof LoginFormData) => {
    const registration = register(name);

    return {
      ...registration,
      onChange: async (e: React.ChangeEvent<HTMLInputElement>) => {
        registration.onChange(e);
        if (touchedWithErrors.has(name)) {
          await trigger(name);
        }
      },
      onFocus: () => {
        // Clear root API error and success message when any input gets focus
        if (errors.root) {
          clearErrors("root");
        }
        if (successMessage) {
          setSuccessMessage("");
        }
      },
      onBlur: async (e: React.FocusEvent<HTMLInputElement>) => {
        registration.onBlur(e);
        // Always validate on blur
        await trigger(name);
        // If there's an error after blur, add to touchedWithErrors
        if (errors[name]) {
          setTouchedWithErrors((prev) => new Set(prev).add(name));
        }
      },
    };
  };

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
          {successMessage && (
            <div className={styles.success}>
              {successMessage}
            </div>
          )}

          {/* Root error for API errors */}
          {errors.root && (
            <div className={styles.alert}>
              <span className={styles.span}>&#9888;</span>
              {errors.root.message}
            </div>
          )}

          {/* Form Fields */}
          <div className={styles.formGroup}>
            <FloatingLabelInput
              id="email"
              label="Email"
              type="email"
              placeholder="Email"
              register={customRegister("email")}
              errors={errors.email}
              ariaInvalid={errors.email ? "true" : "false"}
            />
            <div className={errors.email ? styles.errorVisible : styles.errorHidden}>
              <span className={styles.span}>&#9888;</span>
              {errors.email?.message || '\u00A0'}
            </div>
          </div>

          <div className={styles.formGroup}>
            <FloatingLabelInput
              id="password"
              label="Password"
              type="password"
              placeholder="Password"
              register={customRegister("password")}
              errors={errors.password}
              ariaInvalid={errors.password ? "true" : "false"}
            />
            <div className={errors.password ? styles.errorVisible : styles.errorHidden}>
              <span className={styles.span}>&#9888;</span>
              {errors.password?.message || '\u00A0'}
            </div>
          </div>

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
