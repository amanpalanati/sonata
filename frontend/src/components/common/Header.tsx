import React from "react";
import { Link } from "react-router-dom";

import ProfileDropdown from "./ProfileDropdown";

import styles from "../../styles/common/Header.module.css";

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <nav className={styles.left}>
        <Link className={styles.logo} to="/dashboard">
          <img src="/images/transparent-sonata.png" alt="app-name/logo" />
        </Link>
        <Link className={styles.leftNavItem} to="#">
          Item1
        </Link>
        <Link className={styles.leftNavItem} to="#">
          Item2
        </Link>
        <Link className={styles.leftNavItem} to="/about">
          About
        </Link>
      </nav>
      <nav className={styles.right}>
        <Link className={styles.rightNavItem} to="#">
          Calendar
        </Link>
        <Link className={styles.rightNavItem} to="#">
          Messages
        </Link>
        <Link className={styles.rightNavItem} to="/help">
          Help
        </Link>
        <ProfileDropdown />
      </nav>
    </header>
  );
};

export default Header;
