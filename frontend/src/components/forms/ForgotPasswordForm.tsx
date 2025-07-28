import React from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { ForgotPasswordFormData } from "../../types";
import FloatingLabelInput from "./FloatingLabelInput";

import { useBodyClass } from "../../hooks/useBodyClass";
import styles from "../../styles/forms/LoginForm.module.css";

// Validation schema
const forgotPasswordSchema = yup.object().shape({
  newPassword: yup
    .string()
    .required("Please enter a new password")
    .min(8, "Password must be at least 8 characters long"),
  confirmNewPassword: yup
    .string()
    .required("Please confirm your new password")
    .oneOf([yup.ref("newPassword")], "Passwords must match"),
});

interface ForgotPasswordFormProps {
  onSubmit?: (data: ForgotPasswordFormData) => void | Promise<void>;
}

const ForgotPassword: React.FC<ForgotPasswordFormProps> = ({ onSubmit }) => {
  useBodyClass("auth");
  const navigate = useNavigate();

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
  } = useForm<ForgotPasswordFormData>({
    resolver: yupResolver(forgotPasswordSchema),
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
  const customRegister = (name: keyof ForgotPasswordFormData) => {
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

  const handleFormSubmit = async (data: ForgotPasswordFormData) => {
    try {
      if (onSubmit) {
        await onSubmit(data);
      } else {
        // Default logic when no onSubmit function is provided
        navigate("/login");
      }
    } catch (error) {
      // Clear password field on API errors while keeping email field
      setValue("newPassword", "");
      setValue("confirmNewPassword", "");

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
              id="newPassword"
              label="New Password"
              type="password"
              placeholder="New Password"
              register={customRegister("newPassword")}
              errors={errors.newPassword}
              ariaInvalid={errors.newPassword ? "true" : "false"}
            />
            {errors.newPassword && (
              <div className={styles.error}>
                <span className={styles.span}>&#9888;</span>
                {errors.newPassword.message}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <FloatingLabelInput
              id="confirmNewPassword"
              label="Confirm New Password"
              type="password"
              placeholder="Confirm New Password"
              register={customRegister("confirmNewPassword")}
              errors={errors.confirmNewPassword}
              ariaInvalid={errors.confirmNewPassword ? "true" : "false"}
            />
            {errors.confirmNewPassword && (
              <div className={styles.error}>
                <span className={styles.span}>&#9888;</span>
                {errors.confirmNewPassword.message}
              </div>
            )}
          </div>

          <button
            className={styles.submitButton}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>
      </div>
    </>
  );
};

export default ForgotPassword;
