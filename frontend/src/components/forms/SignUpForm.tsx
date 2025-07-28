import React from "react";
import { Link, useParams, useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { SignUpFormData } from "../../types";

import FloatingLabelInput from "./FloatingLabelInput";
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

  // Track which fields have been blurred and had errors
  const [touchedWithErrors, setTouchedWithErrors] = React.useState<Set<string>>(
    new Set()
  );

  // Track which fields have been touched (blurred)
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(
    new Set()
  );

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

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    trigger,
    setValue,
    clearErrors,
  } = useForm<Omit<SignUpFormData, "accountType">>({
    resolver: yupResolver(signUpSchema),
    mode: "onBlur",
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

  // Effect to track which fields have errors after blur
  React.useEffect(() => {
    Object.keys(errors).forEach((fieldName) => {
      if (fieldName !== "root") {
        setTouchedWithErrors((prev) => new Set(prev).add(fieldName));
      }
    });
  }, [errors]);

  // Custom register function that adds onChange validation for fields with errors
  const customRegister = (name: keyof Omit<SignUpFormData, "accountType">) => {
    const registration = register(name);

    return {
      ...registration,
      onChange: async (e: React.ChangeEvent<HTMLInputElement>) => {
        registration.onChange(e);
        // If this field has had an error before, validate on change
        if (touchedWithErrors.has(name)) {
          await trigger(name);
        }
        // If password field changes and confirm password has been touched, validate confirm password
        if (name === "password" && touchedFields.has("confirmPassword")) {
          await trigger("confirmPassword");
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
        // Mark field as touched
        setTouchedFields((prev) => new Set(prev).add(name));
        // Always validate on blur
        await trigger(name);
        // If there's an error after blur, add to touchedWithErrors
        if (errors[name]) {
          setTouchedWithErrors((prev) => new Set(prev).add(name));
        }
      },
    };
  };

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
              id="firstName"
              label="First Name"
              type="text"
              placeholder="First Name"
              register={customRegister("firstName")}
              errors={errors.firstName}
              ariaInvalid={errors.firstName ? "true" : "false"}
            />
            <div className={errors.firstName ? styles.errorVisible : styles.errorHidden}>
              <span className={styles.span}>&#9888;</span>
              {errors.firstName?.message || '\u00A0'}
            </div>
          </div>

          <div className={styles.formGroup}>
            <FloatingLabelInput
              id="lastName"
              label="Last Name"
              type="text"
              placeholder="Last Name"
              register={customRegister("lastName")}
              errors={errors.lastName}
              ariaInvalid={errors.lastName ? "true" : "false"}
            />
            <div className={errors.lastName ? styles.errorVisible : styles.errorHidden}>
              <span className={styles.span}>&#9888;</span>
              {errors.lastName?.message || '\u00A0'}
            </div>
          </div>

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

          <div className={styles.formGroup}>
            <FloatingLabelInput
              id="confirmPassword"
              label="Confirm Password"
              type="password"
              placeholder="Confirm Password"
              register={customRegister("confirmPassword")}
              errors={errors.confirmPassword}
              ariaInvalid={errors.confirmPassword ? "true" : "false"}
            />
            <div className={errors.confirmPassword ? styles.errorVisible : styles.errorHidden}>
              <span className={styles.span}>&#9888;</span>
              {errors.confirmPassword?.message || '\u00A0'}
            </div>
          </div>

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
