import React from "react";
import { FieldError as HookFormFieldError } from "react-hook-form";

import FloatingLabelTextArea from "./FloatingLabelTextArea";
import FieldError from "./FieldError";

interface TextAreaFieldProps {
  id: string;
  label: string;
  placeholder: string;
  register: any; // More flexible type to handle custom register functions
  error?: HookFormFieldError;
  styles: Record<string, string>; // More flexible for CSS modules
  className?: string;
  rows?: number; // Minimum number of rows
  maxRows?: number; // Maximum number of rows before scrolling
  maxChar?: number; // Maximum number of characters
}

/**
 * A complete textarea field component that combines FloatingLabelTextArea with FieldError.
 * This textarea automatically expands height based on content.
 *
 * Usage:
 * <TextAreaField
 *   id="bio"
 *   label="Bio"
 *   placeholder="Tell us about yourself..."
 *   register={customRegister("bio")}
 *   error={errors.bio}
 *   styles={styles}
 *   rows={3}
 *   maxRows={8}
 *   maxChar={500}
 * />
 */
const TextAreaField: React.FC<TextAreaFieldProps> = ({
  id,
  label,
  placeholder,
  register,
  error,
  styles,
  className,
  rows = 3,
  maxRows = 8,
  maxChar,
}) => {
  return (
    <div className={className || styles.formGroup}>
      <FloatingLabelTextArea
        id={id}
        label={label}
        placeholder={placeholder}
        register={register}
        ariaInvalid={error ? "true" : "false"}
        rows={rows}
        maxRows={maxRows}
        maxChar={maxChar}
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

export default TextAreaField;
