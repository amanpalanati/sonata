import React from "react";
import { FieldError as HookFormFieldError } from "react-hook-form";

import FloatingLabelInput from "./FloatingLabelInput";
import FieldError from "./FieldError";

interface FormFieldProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  register: any; // More flexible type to handle custom register functions
  error?: HookFormFieldError;
  styles: Record<string, string>; // More flexible for CSS modules
  className?: string;
}

/**
 * A complete form field component that combines FloatingLabelInput with FieldError.
 * This is the highest level of abstraction - use this for maximum code reduction.
 * 
 * Usage:
 * <FormField
 *   id="email"
 *   label="Email"
 *   type="email"
 *   placeholder="Email"
 *   register={customRegister("email")}
 *   error={errors.email}
 *   styles={styles}
 * />
 */
const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  type,
  placeholder,
  register,
  error,
  styles,
  className,
}) => {
  return (
    <div className={className || styles.formGroup}>
      <FloatingLabelInput
        id={id}
        label={label}
        type={type}
        placeholder={placeholder}
        register={register}
        errors={error}
        ariaInvalid={error ? "true" : "false"}
      />
      <FieldError
        error={error}
        errorVisibleClass={styles.errorVisible}
        errorHiddenClass={styles.errorHidden}
        spanClass={styles.span}
      />
    </div>
  );
};

export default FormField;
