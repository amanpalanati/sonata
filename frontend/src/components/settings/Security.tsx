import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { useFormFieldManagement } from "../../hooks/useFormFieldManagement";
import { authService } from "../../services/auth";
import { ChangePasswordFormData } from "../../types";

import FormField from "../forms/fields/FormField";
import RootMessage from "../forms/fields/RootMessage";

import styles from "../../styles/settings/Settings.module.css";

// Validation schema
const changePasswordSchema = yup.object().shape({
  currentPassword: yup.string().required("Current password is required"),
  newPassword: yup
    .string()
    .required("New password is required")
    .min(8, "New password must be at least 8 characters long"),
  confirmPassword: yup
    .string()
    .required("Please confirm your new password")
    .oneOf([yup.ref("newPassword")], "Passwords must match"),
});

const Security: React.FC = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);

  const form = useForm<ChangePasswordFormData>({
    resolver: yupResolver(changePasswordSchema),
    mode: "onBlur", // Validate on blur first, then onChange after touched
    reValidateMode: "onChange", // Re-validate on change after first validation
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const {
    handleSubmit,
    formState: { errors, touchedFields },
    reset,
    trigger,
    watch,
  } = form;

  // Clear error messages when user starts typing
  const handleFieldFocus = () => {
    if (message && message.type === "error") {
      setMessage(null);
    }
  };

  // Function to blur all form fields (remove focus)
  const blurAllFields = () => {
    const formFields = document.querySelectorAll(
      "#currentPassword, #newPassword, #confirmPassword"
    );
    formFields.forEach((field) => {
      if (field instanceof HTMLElement) {
        field.blur();
      }
    });
  };

  const { customRegister } = useFormFieldManagement({
    form,
    onFocus: handleFieldFocus,
  });

  // Watch all form values to check if form is empty
  const watchedValues = watch();

  // Watch the newPassword field to trigger confirmPassword validation
  const newPassword = watch("newPassword");

  // Check if form is completely empty
  const isFormEmpty =
    !watchedValues.currentPassword ||
    !watchedValues.newPassword ||
    !watchedValues.confirmPassword;

  // Trigger confirmPassword validation when newPassword changes, but only if confirmPassword has been touched
  useEffect(() => {
    if (touchedFields.confirmPassword && newPassword) {
      trigger("confirmPassword");
    }
  }, [newPassword, touchedFields.confirmPassword, trigger]);

  // Check if there are any field errors
  const hasFieldErrors = Object.keys(errors).some((key) => key !== "root");

  // Handle form submission
  const onSubmit = async (data: ChangePasswordFormData) => {
    setIsSubmitting(true);

    try {
      const result = await authService.changePassword(data);

      if (result.success) {
        setMessage({
          text: "Your password was changed successfully",
          type: "success",
        });
        reset(); // Clear the form after successful password change

        // Clear the success message after 3 seconds
        setTimeout(() => {
          setMessage(null);
        }, 3000);
      } else {
        // Handle specific error types
        const errorMessage = result.error || "Failed to change password";

        // Clear any success message when there's an error
        setMessage(null);

        if (
          errorMessage
            .toLowerCase()
            .includes("current password is incorrect") ||
          errorMessage.toLowerCase().includes("invalid") ||
          errorMessage.toLowerCase().includes("wrong")
        ) {
          setMessage({
            text: "The current password you entered is incorrect. Please try again.",
            type: "error",
          });
          // Clear all fields on error
          reset();
          blurAllFields(); // Remove focus from all fields
        } else if (
          errorMessage
            .toLowerCase()
            .includes("new password must be different") ||
          errorMessage.toLowerCase().includes("different from current") ||
          errorMessage.toLowerCase().includes("same")
        ) {
          setMessage({
            text: "Your new password must be different from your current password.",
            type: "error",
          });
          // Clear all fields on error
          reset();
          blurAllFields(); // Remove focus from all fields
        } else {
          setMessage({ text: errorMessage, type: "error" });
          // Clear all fields on error
          reset();
          blurAllFields(); // Remove focus from all fields
        }
      }
    } catch (error) {
      console.error("Error changing password:", error);

      // Clear any success message when there's an error
      setMessage(null);

      // Check if it's a network/auth error
      if (error instanceof Error) {
        const errorMessage = error.message;

        if (
          errorMessage.includes("Current password is incorrect") ||
          errorMessage.toLowerCase().includes("invalid") ||
          errorMessage.toLowerCase().includes("wrong")
        ) {
          setMessage({
            text: "The current password is incorrect. Please try again.",
            type: "error",
          });
        } else if (
          errorMessage.includes(
            "New password must be different from current password"
          ) ||
          errorMessage.toLowerCase().includes("different from current") ||
          errorMessage.toLowerCase().includes("same")
        ) {
          setMessage({
            text: "Your new password must be different from your current password.",
            type: "error",
          });
        } else if (errorMessage.includes("logged in")) {
          setMessage({
            text: "You must be logged in to change your password. Please refresh and try again.",
            type: "error",
          });
        } else {
          setMessage({
            text: "An unexpected error occurred. Please try again.",
            type: "error",
          });
        }
      } else {
        setMessage({
          text: "An unexpected error occurred. Please try again.",
          type: "error",
        });
      }
      // Clear all fields on any error
      reset();
      blurAllFields(); // Remove focus from all fields
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.content}>
      <h1 className={styles.contentTitle}>Security</h1>

      <hr className={styles.divider} />

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.passwordWrapper}>
          {message && (
            <RootMessage
              message={message.text}
              type={message.type}
              styles={{
                alert: styles.alert,
                success: styles.success,
                span: styles.span,
              }}
            />
          )}

          <FormField
            id="currentPassword"
            label="Current Password"
            type="password"
            placeholder="Enter your current password"
            register={customRegister("currentPassword")}
            error={errors.currentPassword}
            styles={styles}
          />

          <FormField
            id="newPassword"
            label="New Password"
            type="password"
            placeholder="Enter your new password"
            register={customRegister("newPassword")}
            error={errors.newPassword}
            styles={styles}
          />

          <FormField
            id="confirmPassword"
            label="Confirm New Password"
            type="password"
            placeholder="Confirm your new password"
            register={customRegister("confirmPassword")}
            error={errors.confirmPassword}
            styles={styles}
          />

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || hasFieldErrors || isFormEmpty}
          >
            {isSubmitting ? "Changing Password..." : "Change Password"}
          </button>
        </div>
      </form>

      <hr className={styles.divider} />
    </div>
  );
};

export default Security;
