import React, { useState, useEffect } from "react";
import styles from "../../../styles/forms/FloatingLabelInput.module.css";

interface FloatingLabelInputProps {
  id: string;
  label: string;
  type?: string;
  placeholder?: string;
  register: any;
  errors: any;
  ariaInvalid?: string;
}

const FloatingLabelInput: React.FC<FloatingLabelInputProps> = ({
  id,
  label,
  type = "text",
  placeholder = "",
  register,
  errors,
  ariaInvalid,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const [isAutofilled, setIsAutofilled] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    register.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(e.target.value.length > 0);
    register.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(e.target.value.length > 0);
    register.onChange?.(e);
  };

  // Check for autofill after component mounts and on interval
  useEffect(() => {
    const checkAutofill = () => {
      const input = document.getElementById(id) as HTMLInputElement;
      if (input) {
        const isCurrentlyAutofilled = input.matches(":-webkit-autofill");
        const currentHasValue = input.value.length > 0;

        setIsAutofilled(isCurrentlyAutofilled);
        setHasValue(currentHasValue);
      }
    };

    // Check immediately and then periodically
    checkAutofill();
    const interval = setInterval(checkAutofill, 100);

    return () => clearInterval(interval);
  }, [id]);

  const isFloating = isFocused || hasValue || isAutofilled;

  return (
    <div className={styles.floatingGroup}>
      <input
        id={id}
        type={type}
        className={`${styles.input} ${errors ? styles.inputError : ""}`}
        placeholder={isFocused ? placeholder : ""}
        aria-invalid={ariaInvalid}
        {...register}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
      />
      <label
        htmlFor={id}
        className={`${styles.label} ${isFloating ? styles.labelFloating : ""}`}
      >
        {label}
      </label>
    </div>
  );
};

export default FloatingLabelInput;
