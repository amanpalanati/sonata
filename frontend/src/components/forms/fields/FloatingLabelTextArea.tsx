import React, { useEffect, useRef, useState } from "react";

import styles from "../../../styles/forms/FloatingLabelTextArea.module.css";

interface FloatingLabelTextAreaProps {
  id: string;
  label: string;
  placeholder: string;
  register: any; // Flexible type to handle custom register functions
  ariaInvalid?: "true" | "false";
  rows?: number; // Minimum number of rows
  maxRows?: number; // Maximum number of rows before scrolling
  maxChar?: number; // Maximum number of characters
}

/**
 * A floating label textarea component that automatically expands height based on content.
 * Used as a lower-level component, typically wrapped by TextAreaField.
 */
const FloatingLabelTextArea: React.FC<FloatingLabelTextAreaProps> = ({
  id,
  label,
  placeholder,
  register,
  ariaInvalid = "false",
  rows = 3,
  maxRows = 8,
  maxChar,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const [showPlaceholder, setShowPlaceholder] = useState(false);

  // Auto-resize function based on line counting approach
  const autoResize = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to recalculate scrollHeight correctly
    textarea.style.height = "auto";

    const lineHeight = 25;
    const minRows = rows;
    const maxRowsLimit = maxRows;
    const bottomPadding = 8; // Add extra padding to prevent text touching bottom border

    // Calculate how many lines we need based on scroll height
    const lines = Math.floor(textarea.scrollHeight / lineHeight);
    const calculatedRows = Math.min(Math.max(lines, minRows), maxRowsLimit);

    // Set the height based on calculated rows with extra bottom padding
    textarea.style.height = `${calculatedRows * lineHeight + bottomPadding}px`;

    // Enable scroll only if we reach the max row limit
    textarea.style.overflowY =
      calculatedRows === maxRowsLimit ? "auto" : "hidden";
  };

  const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    setShowPlaceholder(false); // Hide placeholder immediately when focused
    register.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    const value = e.target.value;
    const isEmpty = value === "";
    setHasValue(!isEmpty);
    setCharCount(value.length);

    // Only show placeholder after label transition completes (150ms + small buffer)
    if (isEmpty) {
      setTimeout(() => setShowPlaceholder(true), 90);
    }

    register.onBlur?.(e);
  };

  // Handle input changes for auto-resize and character counting
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const target = e.target;
    let value = target.value;

    // Apply character limit if specified
    if (maxChar && value.length > maxChar) {
      value = value.substring(0, maxChar);
      target.value = value;
    }

    const isEmpty = value === "";
    setHasValue(!isEmpty);
    setCharCount(value.length);

    // Hide placeholder when user starts typing
    if (!isEmpty) {
      setShowPlaceholder(false);
    }

    // Call the register onChange first
    if (register && register.onChange) {
      const modifiedEvent = {
        ...e,
        target: { ...target, value },
      };
      register.onChange(modifiedEvent);
    }

    // Then auto-resize immediately after state updates
    requestAnimationFrame(() => autoResize());
  };

  // Auto-resize on mount and when content changes
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Check if textarea has initial content
      const value = textarea.value;
      const isEmpty = value === "";
      setHasValue(!isEmpty);
      setCharCount(value.length);
      setShowPlaceholder(isEmpty); // Show placeholder only if empty

      // Initial resize to handle any existing content
      requestAnimationFrame(() => autoResize());
    }
  }, [rows, maxRows]);

  // Additional useEffect to handle initial resize after component mounts
  useEffect(() => {
    const timer = setTimeout(() => {
      const textarea = textareaRef.current;
      if (textarea) {
        const value = textarea.value;
        const isEmpty = value === "";
        setHasValue(!isEmpty);
        setCharCount(value.length);
        setShowPlaceholder(isEmpty); // Show placeholder only if empty
        autoResize();
      }
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  const isFloating = isFocused || hasValue;

  // Calculate character counter styling
  const getCharCounterClass = () => {
    if (!maxChar) return styles.charCounter;
    const percentage = (charCount / maxChar) * 100;
    if (percentage >= 95)
      return `${styles.charCounter} ${styles.charCounterDanger}`;
    if (percentage >= 80)
      return `${styles.charCounter} ${styles.charCounterWarning}`;
    return styles.charCounter;
  };

  return (
    <div className={styles.floatingGroup}>
      {/* Character counter */}
      {maxChar && hasValue && (
        <div className={getCharCounterClass()}>
          {charCount}/{maxChar}
        </div>
      )}

      <textarea
        ref={(e) => {
          textareaRef.current = e;
          register.ref(e);
        }}
        id={id}
        placeholder={showPlaceholder ? placeholder : ""}
        aria-invalid={ariaInvalid}
        name={register.name}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        rows={rows}
        maxLength={maxChar}
        className={`${styles.textarea} ${
          ariaInvalid === "true" ? styles.textareaError : ""
        }`}
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

export default FloatingLabelTextArea;
