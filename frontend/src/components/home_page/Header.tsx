import React from "react";
import { Link } from "react-router-dom";

import styles from "../../styles/home_page/Header.module.css";

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <nav className={styles.left}>
        <Link className={styles.logo} to="/">
          <img src="./placeholder-logo.png" alt="app-name/logo" />
        </Link>
        <Link className={styles.leftNavItem} to="/signup/student">
          Learn
        </Link>
        <Link className={styles.leftNavItem} to="/signup/teacher">
          Teach
        </Link>
        <Link className={styles.leftNavItem} to="/about">
          About
        </Link>
      </nav>
      <nav className={styles.right}>
        <Link className={styles.rightNavItem} to="/help">
          Help
        </Link>
        <Link className={styles.rightNavItem} to="/login">
          Log In
        </Link>
        <Link className={styles.signUp} to="/signup">
          Sign Up
        </Link>
      </nav>
    </header>
  );
};

export default Header;
