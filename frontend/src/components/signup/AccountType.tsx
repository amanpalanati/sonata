import React from "react";
import { Link } from "react-router-dom";

import Header from "./Header";

import { useBodyClass } from "../../hooks/useBodyClass";
import styles from "../../styles/signup_login/AccountType.module.css";

const AccountType: React.FC = () => {
  useBodyClass("auth");

  return (
    <>
      <Header />
      <div className={styles.container}>
        <h1 className={styles.h1}>Choose Your Account Type</h1>
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
