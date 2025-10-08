import React from "react";
import { Link } from "react-router-dom";

import ProfileDropdown from "./ProfileDropdown";

import styles from "../../styles/common/Header.module.css";

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <nav className={styles.left}>
        <Link className={styles.logo} to="/dashboard">
        <img src="/images/logos/transparent-sonata.png" alt="Sonata" />
        </Link>
        <Link className={styles.leftNavItem} to="#">
          Calendar
        </Link>
        <Link className={styles.leftNavItem} to="#">
          Messages
        </Link>
        <Link className={styles.leftNavItem} to="/about">
          About
        </Link>
      </nav>
      <nav className={styles.right}>
        <Link className={styles.rightNavItem} to="/help">
          Help
        </Link>
        <ProfileDropdown />
      </nav>
    </header>
  );
};

export default Header;
