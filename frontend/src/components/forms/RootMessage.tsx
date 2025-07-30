import React from "react";

interface RootMessageProps {
  message?: string;
  type: "error" | "success";
  styles: {
    alert?: string;
    success?: string;
    span?: string;
  };
  showIcon?: boolean;
}

/**
 * A reusable component for displaying root-level messages (API errors, success messages).
 * Automatically renders nothing if no message is provided.
 *
 * Usage:
 * // For API errors
 * <RootMessage
 *   message={errors.root?.message}
 *   type="error"
 *   styles={{ alert: styles.alert, span: styles.span }}
 * />
 *
 * // For success messages
 * <RootMessage
 *   message={successMessage}
 *   type="success"
 *   styles={{ success: styles.success }}
 *   showIcon={false}
 * />
 */
const RootMessage: React.FC<RootMessageProps> = ({
  message,
  type,
  styles,
  showIcon = true,
}) => {
  if (!message) return null;

  const messageClass = type === "error" ? styles.alert : styles.success;

  return (
    <div className={messageClass}>
      {showIcon && type === "error" && styles.span && (
        <span className={styles.span}>&#9888;</span>
      )}
      {message}
    </div>
  );
};

export default RootMessage;
