import React from "react";
import { useBodyClass } from "../../hooks/useBodyClass";
import styles from "../../styles/forms/LoginForm.module.css";

interface ForgotPasswordEmailSentProps {
  email: string;
  onBackToLogin: () => void;
}

const ForgotPasswordEmailSent: React.FC<ForgotPasswordEmailSentProps> = ({ 
  email, 
  onBackToLogin 
}) => {
  useBodyClass("auth");

  return (
    <>
      <div className={styles.wrapper}></div>
      <div className={styles.container}>
        <h1 className={styles.h1}>Check Your Email</h1>
        
        <div style={{ 
          textAlign: 'center', 
          padding: '2rem 0',
          fontSize: '16px',
          lineHeight: '1.5'
        }}>
          <div style={{ 
            fontSize: '48px', 
            marginBottom: '1rem',
            color: '#28a745'
          }}>
            ✉️
          </div>
          
          <p style={{ marginBottom: '1rem', color: '#333' }}>
            If an account with <strong>{email}</strong> exists, we've sent a password reset link to that email address.
          </p>
          
          <p style={{ marginBottom: '2rem', color: '#666', fontSize: '14px' }}>
            Please check your email and click the link to reset your password. 
            The link will expire in 1 hour.
          </p>
          
          <p style={{ marginBottom: '2rem', color: '#666', fontSize: '14px' }}>
            Don't see the email? Check your spam folder or try again with a different email address.
          </p>
        </div>

        <button
          className={styles.submitButton}
          type="button"
          onClick={onBackToLogin}
          style={{ marginTop: '1rem' }}
        >
          Back to Login
        </button>
      </div>
    </>
  );
};

export default ForgotPasswordEmailSent;
