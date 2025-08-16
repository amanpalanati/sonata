import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { StepComponentProps } from "../../../types/profileCompletion";
import { useFormFieldManagement } from "../../../hooks/useFormFieldManagement";

import FormField from "../../forms/fields/FormField";
import RootMessage from "../../forms/fields/RootMessage";

import { useBodyClass } from "../../../hooks/useBodyClass";
import styles from "../../../styles/authentication/ProfileCompletion.module.css";

// Validation schema
const nameEmailSchema = yup.object().shape({
  firstName: yup
    .string()
    .required("First name is required")
    .min(2, "First name must be at least 2 characters")
    .max(50, "First name must be less than 50 characters")
    .trim(),
  lastName: yup
    .string()
    .required("Last name is required")
    .min(2, "Last name must be at least 2 characters")
    .max(50, "Last name must be less than 50 characters")
    .trim(),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .max(100, "Email must be less than 100 characters")
    .trim(),
});

// Form data type that matches the schema (required fields)
interface NameEmailFormData {
  firstName: string;
  lastName: string;
  email: string;
}

// Extract just the properties this component needs (optional for props)
interface NameEmailData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface NameEmailProps extends Pick<StepComponentProps, "onNext" | "onPrev"> {
  data: NameEmailData;
  onUpdate: (data: Partial<NameEmailData>) => void;
}

const NameEmail: React.FC<NameEmailProps> = ({
  data,
  onUpdate,
  onNext,
  onPrev,
}) => {
  useBodyClass("auth");

  const form = useForm<NameEmailFormData>({
    resolver: yupResolver(nameEmailSchema),
    defaultValues: {
      firstName: data.firstName || "",
      lastName: data.lastName || "",
      email: data.email || "",
    },
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = form;

  // Use the custom hook for field management
  const { customRegister } = useFormFieldManagement({
    form,
  });

  const handleFormSubmit = async (formData: NameEmailFormData) => {
    try {
      // Update parent state with current values
      onUpdate({
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
      });
      onNext();
    } catch (error) {
      // Handle any errors
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
        <h1 className={styles.h1}>Complete Your Profile</h1>
        <p className={styles.p}>Please provide your name and email.</p>

        <form
          className={styles.form}
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
        >
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
            id="firstName"
            label="First Name"
            type="text"
            placeholder="First Name"
            register={customRegister("firstName")}
            error={errors.firstName}
            styles={styles}
          />

          <FormField
            id="lastName"
            label="Last Name"
            type="text"
            placeholder="Last Name"
            register={customRegister("lastName")}
            error={errors.lastName}
            styles={styles}
          />

          <FormField
            id="email"
            label="Email"
            type="email"
            placeholder="Email"
            register={customRegister("email")}
            error={errors.email}
            styles={styles}
          />

          {/* Navigation buttons */}
          {onPrev ? (
            <div className={styles.nextPrevDiv}>
              <button
                className={styles.prevNext}
                type="button"
                onClick={onPrev}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="19"
                  height="19"
                  className={styles.leftArrow}
                >
                  <path
                    d="M10 4 L16 10 L10 16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back
              </button>
              <button
                className={styles.prevNext}
                type="submit"
                disabled={isSubmitting}
              >
                Next
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="18"
                  height="18"
                  className={styles.rightArrow}
                >
                  <path
                    d="M10 4 L16 10 L10 16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className={styles.nextDiv}>
              <button
                className={styles.prevNext}
                type="submit"
                disabled={isSubmitting}
              >
                Next
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="18"
                  height="18"
                  className={styles.rightArrow}
                >
                  <path
                    d="M10 4 L16 10 L10 16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </form>
      </div>
    </>
  );
};

export default NameEmail;
