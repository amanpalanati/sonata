import React, { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

import Header from "./Header";

import { useBodyClass } from "../../hooks/useBodyClass";
import styles from "../../styles/signup_login/AccountType.module.css";

const AccountType: React.FC = () => {
  useBodyClass("auth");
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // If user is already authenticated, redirect to dashboard
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return <></>;
  }

  // Don't render account type selection if already authenticated (will redirect)
  if (isAuthenticated) {
    return null;
  }

  return (
    <>
      <div className={styles.wrapper}></div>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.h1}>Choose Account Type</h1>
        <div className={styles.accountTypes}>
          <Link className={styles.link} to="/signup/student">
            Student
          </Link>
          <Link className={styles.link} to="/signup/teacher">
            Teacher
          </Link>
          <Link className={styles.link} to="/signup/parent">
            Parent
          </Link>
        </div>
      </div>
    </>
  );
};

export default AccountType;
