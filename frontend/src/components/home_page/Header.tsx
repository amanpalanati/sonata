import React from "react";
import { Link } from "react-router-dom";

import SignUpDropdown from "./SignUpDropdown";

import styles from "../../styles/home_page/Header.module.css";

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <nav className={styles.left}>
        <Link className={styles.logo} to="/">
        <img src="/images/logos/transparent-sonata.png" alt="Sonata" />
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
        <SignUpDropdown />
      </nav>
    </header>
  );
};

export default Header;
