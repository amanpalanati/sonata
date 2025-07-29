import React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { ForgotPasswordEmailData } from "../../types";
import FloatingLabelInput from "./FloatingLabelInput";

import { useBodyClass } from "../../hooks/useBodyClass";
import styles from "../../styles/forms/ForgotPassword.module.css";

// Validation schema
const emailSchema = yup.object().shape({
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .trim(),
});

interface ForgotPasswordEmailFormProps {
  onSubmit?: (data: ForgotPasswordEmailData) => void | Promise<void>;
}

const ForgotPasswordEmailForm: React.FC<ForgotPasswordEmailFormProps> = ({
  onSubmit,
}) => {
  useBodyClass("auth");

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
    clearErrors,
  } = useForm<ForgotPasswordEmailData>({
    resolver: yupResolver(emailSchema),
  });

  // Effect to track which fields have errors after blur
  React.useEffect(() => {
    Object.keys(errors).forEach((fieldName) => {
      if (fieldName !== "root") {
        setTouchedWithErrors((prev) => new Set(prev).add(fieldName));
      }
    });
  }, [errors]);

  // Custom register function that adds onChange validation for fields with errors
  const customRegister = (name: keyof ForgotPasswordEmailData) => {
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
        // Clear root API error when any input gets focus
        if (errors.root) {
          clearErrors("root");
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

  const handleFormSubmit = async (data: ForgotPasswordEmailData) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Default logic when no onSubmit function is provided
        // Email submitted successfully
      }
    } catch (error) {
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
        <h1 className={styles.h1}>Reset Password</h1>
        <p className={styles.p}>
          Enter the email address associated with your account and we'll help
          reset your password.
        </p>

        {/* Root error for API errors */}
        {errors.root && (
          <div className={styles.alert}>
            <span className={styles.span}>&#9888;</span>
            {errors.root.message}
          </div>
        )}

        <form
          className={styles.form}
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
        >
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
            <div
              className={
                errors.email ? styles.errorVisible : styles.errorHidden
              }
            >
              <span className={styles.span}>&#9888;</span>
              {errors.email?.message || "\u00A0"}
            </div>
          </div>

          <button
            className={styles.submitButton}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Verifying..." : "Continue"}
          </button>
        </form>

        <Link className={styles.link} to="/login">
          Back to Log In
        </Link>
      </div>
    </>
  );
};

export default ForgotPasswordEmailForm;
