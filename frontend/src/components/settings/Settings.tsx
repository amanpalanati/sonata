import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";

import { useTitle } from "../../hooks/useTitle";

import Header from "../common/Header";
import AccountInfo from "./AccountInfo";
import Notifications from "./Notifications";
import Wallet from "./Wallet";
import Security from "./Security";
import Privacy from "./Privacy";

import styles from "../../styles/settings/Settings.module.css";

const Settings: React.FC = () => {
  useTitle("Settings");
  const location = useLocation();
  const mobileNavRef = useRef<HTMLDivElement>(null);

  // Menu items data
  const menuItems = [
    { path: "/account/info", label: "Account info" },
    { path: "/account/notifications", label: "Notifications" },
    { path: "/account/wallet", label: "Wallet" },
    { path: "/account/security", label: "Security" },
    { path: "/account/privacy", label: "Privacy" },
  ];

  // Function to determine if a path is currently active
  const isActivePath = (path: string) => {
    return location.pathname === path;
  };

  // Auto-center selected item in mobile nav
  useEffect(() => {
    if (mobileNavRef.current) {
      const activeItem = mobileNavRef.current.querySelector(
        `.${styles.mobileNavItemSelected}`
      ) as HTMLElement;
      
      if (activeItem) {
        const container = mobileNavRef.current;
        const containerWidth = container.offsetWidth;
        const itemWidth = activeItem.offsetWidth;
        const itemLeft = activeItem.offsetLeft;
        
        // Calculate center position
        const scrollLeft = itemLeft - (containerWidth / 2) + (itemWidth / 2);
        
        container.scrollTo({
          left: scrollLeft,
          behavior: 'smooth'
        });
      }
    }
  }, [location.pathname]);

  // Function to render the appropriate component based on the current path
  const renderContent = () => {
    switch (location.pathname) {
      case "/account/info":
        return <AccountInfo />;
      case "/account/notifications":
        return <Notifications />;
      case "/account/wallet":
        return <Wallet />;
      case "/account/security":
        return <Security />;
      case "/account/privacy":
        return <Privacy />;
      default:
        return <AccountInfo />; // Default to account info
    }
  };

  return (
    <>
      <Header />
      
      {/* Mobile horizontal navigation */}
      <div className={styles.mobileNav}>
        <div className={styles.mobileNavScroller} ref={mobileNavRef}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              className={
                isActivePath(item.path)
                  ? styles.mobileNavItemSelected
                  : styles.mobileNavItem
              }
              to={item.path}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </div>
      
      <div className={styles.page}>
        <div className={styles.sidebar}>
          <h1 className={styles.sidebarTitle}>Manage Account</h1>
          <div className={styles.sidebarItemContainer}>
            <Link
              className={
                isActivePath("/account/info")
                  ? styles.sidebarItemSelected
                  : styles.sidebarItem
              }
              to="/account/info"
            >
              Account info
            </Link>
            <Link
              className={
                isActivePath("/account/notifications")
                  ? styles.sidebarItemSelected
                  : styles.sidebarItem
              }
              to="/account/notifications"
            >
              Notifications
            </Link>
            <Link
              className={
                isActivePath("/account/wallet")
                  ? styles.sidebarItemSelected
                  : styles.sidebarItem
              }
              to="/account/wallet"
            >
              Wallet
            </Link>
            <Link
              className={
                isActivePath("/account/security")
                  ? styles.sidebarItemSelected
                  : styles.sidebarItem
              }
              to="/account/security"
            >
              Security
            </Link>
            <Link
              className={
                isActivePath("/account/privacy")
                  ? styles.sidebarItemSelected
                  : styles.sidebarItem
              }
              to="/account/privacy"
            >
              Privacy
            </Link>
          </div>
        </div>

        <div className={styles.contentArea}>{renderContent()}</div>
      </div>
    </>
  );
};

export default Settings;
