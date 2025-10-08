import React from "react";
import { Link } from "react-router-dom";

import styles from "../../styles/authentication/Header.module.css";

const Header: React.FC = () => {
  return (
    <header className={styles.header}>
      <Link className={styles.logo} to="/">
        <img src="/images/logos/transparent-sonata.png" alt="Sonata" />
      </Link>
    </header>
  );
};

export default Header;
