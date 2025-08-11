import React from "react";
import { UseFormReturn, FieldValues, Path } from "react-hook-form";

interface UseFormFieldManagementProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  passwordField?: Path<T>;
  confirmPasswordField?: Path<T>;
  onFocus?: () => void; // Custom onFocus behavior
}

/**
 * Custom hook that manages form field registration with enhanced validation logic.
 * Handles touched state, error tracking, and cross-field validation (like password/confirmPassword).
 */
export function useFormFieldManagement<T extends FieldValues>({
  form,
  passwordField,
  confirmPasswordField,
  onFocus: customOnFocus,
}: UseFormFieldManagementProps<T>) {
  const {
    register,
    formState: { errors },
    trigger,
    clearErrors,
  } = form;

  // Track which fields have been blurred and had errors
  const [touchedWithErrors, setTouchedWithErrors] = React.useState<Set<string>>(
    new Set()
  );

  // Track which fields have been touched (blurred)
  const [touchedFields, setTouchedFields] = React.useState<Set<string>>(
    new Set()
  );

  // Effect to track which fields have errors after blur
  React.useEffect(() => {
    Object.keys(errors).forEach((fieldName) => {
      if (fieldName !== "root") {
        setTouchedWithErrors((prev) => new Set(prev).add(fieldName));
      }
    });
  }, [errors]);

  // Custom register function that adds enhanced validation behavior
  const customRegister = (name: Path<T>) => {
    const registration = register(name);

    return {
      ...registration,
      onChange: async (e: React.ChangeEvent<HTMLInputElement>) => {
        registration.onChange(e);
        // If this field has had an error before, validate on change
        if (touchedWithErrors.has(name as string)) {
          await trigger(name);
        }
        // If password field changes and confirm password has been touched, validate confirm password
        if (
          passwordField &&
          confirmPasswordField &&
          name === passwordField &&
          touchedFields.has(confirmPasswordField as string)
        ) {
          await trigger(confirmPasswordField);
        }
      },
      onFocus: () => {
        // Clear root API error when any input gets focus
        if (errors.root) {
          clearErrors("root");
        }
        // Execute custom onFocus if provided
        if (customOnFocus) {
          customOnFocus();
        }
      },
      onBlur: async (e: React.FocusEvent<HTMLInputElement>) => {
        registration.onBlur(e);
        // Mark field as touched
        setTouchedFields((prev) => new Set(prev).add(name as string));
        // Always validate on blur
        await trigger(name);
        // If there's an error after blur, add to touchedWithErrors
        if (errors[name]) {
          setTouchedWithErrors((prev) => new Set(prev).add(name as string));
        }
      },
    };
  };

  return {
    customRegister,
    touchedWithErrors,
    setTouchedWithErrors,
    touchedFields,
    setTouchedFields,
  };
}
