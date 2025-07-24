import React from "react";
import { Link } from "react-router-dom";

import styles from "../../styles/signup_login/Header.module.css";

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <Link className={styles.logo} to="/">
        <img src="./placeholder-logo.png" alt="app-name/logo" />
      </Link>
    </header>
  );
};

export default Header;
