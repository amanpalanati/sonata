import React from "react";
import { Link } from "react-router-dom";

import { useBodyClass } from "../../hooks/useBodyClass";
import styles from "../../styles/forms/ForgotPassword.module.css";

interface ForgotPasswordEmailSentProps {
  email: string;
}

const ForgotPasswordEmailSent: React.FC<ForgotPasswordEmailSentProps> = ({ 
  email 
}) => {
  useBodyClass("auth");

  return (
    <>
      <div className={styles.wrapper}></div>
      <div className={styles.container}>
        <h1 className={styles.h1}>Email Sent</h1>


          <p className={styles.emoji}>
            ✉️
          </p>

          <p className={styles.bigText}>
            If an account with <strong>{email}</strong><br /> exists, we've sent a password reset link<br />to that email address.
          </p>

          <p className={styles.bigText}>
            Please check your email and click the link to reset your password.
            The link will<br /> expire in 1 hour.
          </p>

          <p className={styles.smallText}>
            Don't see the email? Check your spam folder or try again with a different email address.
          </p>
        

        <Link className={styles.back} to="/login">
          Back to Log In
        </Link>
      </div>
    </>
  );
};

export default ForgotPasswordEmailSent;
