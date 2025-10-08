import React from "react";
import { Link } from "react-router-dom";

import { useTitle } from "../../hooks/useTitle";

import Header from "./Header";

import { useBodyClass } from "../../hooks/useBodyClass";
import styles from "../../styles/authentication/AccountType.module.css";

const AccountType: React.FC = () => {
  useTitle("Sign Up");
  useBodyClass("auth");

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
