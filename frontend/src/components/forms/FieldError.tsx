import React from "react";
import { FieldError as HookFormFieldError } from "react-hook-form";

interface FieldErrorProps {
  error?: HookFormFieldError;
  className?: string;
  errorVisibleClass?: string;
  errorHiddenClass?: string;
  spanClass?: string;
}

/**
 * A reusable component for displaying field validation errors.
 * Shows error message with warning icon when error exists, maintains space when no error.
 *
 * Usage:
 * <FieldError
 *   error={errors.email}
 *   errorVisibleClass={styles.errorVisible}
 *   errorHiddenClass={styles.errorHidden}
 *   spanClass={styles.span}
 * />
 */
const FieldError: React.FC<FieldErrorProps> = ({
  error,
  className,
  errorVisibleClass = "errorVisible",
  errorHiddenClass = "errorHidden",
  spanClass = "span",
}) => {
  // If className is provided, use it directly, otherwise use the conditional classes
  const errorClass =
    className || (error ? errorVisibleClass : errorHiddenClass);

  return (
    <div className={errorClass}>
      <span className={spanClass}>&#9888;</span>
      {error?.message || "\u00A0"}
    </div>
  );
};

export default FieldError;
