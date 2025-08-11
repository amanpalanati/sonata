import React from "react";
import { Link } from "react-router-dom";

import Header from "../common/Header";

import styles from "../../styles/settings/Settings.module.css";

const Settings: React.FC = () => {
  return (
    <>
      <Header />
      <div className={styles.sidebar}>
        <h1 className={styles.sidebarTitle}>Manage Account</h1>
        <div className={styles.sidebarItemContainer}>
          <Link className={styles.sidebarItemSelected} to="/account/info">
            Account info
          </Link>
          <Link className={styles.sidebarItem} to="/account/notifications">
            Notifications
          </Link>
          <Link className={styles.sidebarItem} to="/account/wallet">
            Wallet
          </Link>
          <Link className={styles.sidebarItem} to="/account/security">
            Security
          </Link>
          <Link className={styles.sidebarItem} to="/account/privacy">
            Privacy
          </Link>
        </div>
      </div>
    </>
  );
};

export default Settings;
