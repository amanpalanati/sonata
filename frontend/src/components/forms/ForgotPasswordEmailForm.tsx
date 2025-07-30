import React from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { ForgotPasswordEmailData } from "../../types";
import { useFormFieldManagement } from "../../hooks/useFormFieldManagement";

import FormField from "./FormField";
import RootMessage from "./RootMessage";

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

  const form = useForm<ForgotPasswordEmailData>({
    resolver: yupResolver(emailSchema),
  });

  const { handleSubmit, formState: { errors, isSubmitting }, setError } = form;

  // Use the custom hook for field management
  const { customRegister } = useFormFieldManagement({ form });

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
        <RootMessage
          message={errors.root?.message}
          type="error"
          styles={{
            alert: styles.alert,
            span: styles.span,
          }}
        />

        <form
          className={styles.form}
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
        >
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
