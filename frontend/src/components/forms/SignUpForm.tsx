import React from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { SignUpFormData } from "../../types";
import { useFormFieldManagement } from "../../hooks/useFormFieldManagement";

import FormField from "./fields/FormField";
import RootMessage from "./fields/RootMessage";
import GoogleSignIn from "./GoogleSignIn";

import { useBodyClass } from "../../hooks/useBodyClass";
import styles from "../../styles/forms/SignUpForm.module.css";

// Validation schema
const signUpSchema = yup.object().shape({
  firstName: yup.string().required("First name is required").trim(),
  lastName: yup.string().required("Last name is required").trim(),
  email: yup
    .string()
    .required("Email is required")
    .email("Please enter a valid email address")
    .trim(),
  password: yup
    .string()
    .required("Password is required")
    .min(8, "Password must be at least 8 characters long"),
  confirmPassword: yup
    .string()
    .required("Please confirm your password")
    .oneOf([yup.ref("password")], "Passwords must match"),
});

interface SignUpFormProps {
  onSubmit?: (data: SignUpFormData) => void | Promise<void>;
}

const SignUpForm: React.FC<SignUpFormProps> = ({ onSubmit }) => {
  useBodyClass("auth");
  const { accountType } = useParams<{ accountType: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Validate account type
  const validAccountTypes = ["student", "teacher", "parent"];
  const normalizedAccountType = accountType?.toLowerCase();

  if (
    !normalizedAccountType ||
    !validAccountTypes.includes(normalizedAccountType)
  ) {
    // Redirect to account type selection if invalid
    React.useEffect(() => {
      navigate("/signup");
    }, [navigate]);
    return null;
  }

  const form = useForm<Omit<SignUpFormData, "accountType">>({
    resolver: yupResolver(signUpSchema),
    mode: "onBlur",
  });

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
    passwordField: "password",
    confirmPasswordField: "confirmPassword",
  });

  // Handle OAuth errors from location state
  React.useEffect(() => {
    const state = location.state as { oauthError?: string } | null;
    if (state?.oauthError) {
      setError("root", {
        type: "manual",
        message: state.oauthError,
      });
      // Clear the state to prevent showing error again on re-render
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, setError, navigate, location.pathname]);

  const handleFormSubmit = async (
    data: Omit<SignUpFormData, "accountType">
  ) => {
    try {
      const formData: SignUpFormData = {
        ...data,
        accountType: normalizedAccountType as SignUpFormData["accountType"],
      };

      if (onSubmit) {
        await onSubmit(formData);
      } else {
        // Default logic when no onSubmit function is provided
        // User registration completed
      }
    } catch (error) {
      // Clear password fields on API errors while keeping other fields
      setValue("password", "");
      setValue("confirmPassword", "");

      // Handle API errors
      if (error instanceof Error) {
        setError("root", {
          type: "manual",
          message: error.message,
        });
      } else {
        setError("root", {
          type: "manual",
          message: "An unexpected error occurred. Please try again.",
        });
      }
    }
  };

  const capitalizeAccountType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  return (
    <>
      <div className={styles.wrapper}></div>
      <div className={styles.container}>
        <h1 className={styles.h1}>
          Create {capitalizeAccountType(normalizedAccountType)} Account
        </h1>

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

          <FormField
            id="password"
            label="Password"
            type="password"
            placeholder="Password"
            register={customRegister("password")}
            error={errors.password}
            styles={styles}
          />

          <FormField
            id="confirmPassword"
            label="Confirm Password"
            type="password"
            placeholder="Confirm Password"
            register={customRegister("confirmPassword")}
            error={errors.confirmPassword}
            styles={styles}
          />

          <button
            className={styles.submitButton}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        <div className={styles.divider}>
          <span className={styles.dividerSpan}>OR</span>
        </div>

        <GoogleSignIn
          text="up"
          mode="signup"
          onError={(message) => setError("root", { type: "manual", message })}
          onFocus={() => clearErrors("root")}
        />

        <p className={styles.p}>
          Already have an account?
          <Link to="/login" className={styles.link}>
            Log in
          </Link>
        </p>
      </div>
    </>
  );
};

export default SignUpForm;
