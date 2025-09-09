import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

import ProfileImageDisplay from "./ProfileImageDisplay";

import styles from "../../styles/common/ProfileDropdown.module.css";
import { authService } from "../../services/auth";

const ProfileDropdown: React.FC = () => {
  const { logoutAndRedirect, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const closeDropdown = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsOpen(false);
      setIsClosing(false);
    }, 150); // Match the animation duration
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeDropdown();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleDropdown = () => {
    if (isOpen && !isClosing) {
      closeDropdown();
    } else if (!isOpen && !isClosing) {
      setIsOpen(true);
    }
  };

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    setIsLoggingOut(true);

    try {
      // Clear backend session first
      await authService.logout();

      // Use the context method that handles redirect properly
      logoutAndRedirect("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if backend logout fails, still redirect
      logoutAndRedirect("/");
    }
  };

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button
        className={styles.profileButton}
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <span className={styles.text}>Hello, {user?.first_name}</span>
        <span className={isOpen ? styles.caretUp : styles.caretDown}>
          &#x25BC;
        </span>
      </button>
      {(isOpen || isClosing) && (
        <div className={`${styles.dropdownContent} ${isClosing ? styles.dropdownContentClosing : ''}`}>
          <div className={styles.dropdownHeader}>
            <Link
              className={styles.imageWrapper}
              to="/account/info?editProfileImage=true"
              onClick={closeDropdown}
            >
              <ProfileImageDisplay styles={styles} />
              <div className={styles.editIcon}>
                <img src="/icons/edit_icon.svg" alt="Edit" />
              </div>
            </Link>
            <div>
              <p className={styles.subtext}>
                {user?.first_name} {user?.last_name}
              </p>
              <p className={styles.subtext}>{user?.email}</p>
            </div>
            <div className={styles.optionsContainer}>
              <Link
                className={styles.option}
                to="/dashboard"
                onClick={closeDropdown}
              >
                <img
                  className={styles.optionIcon}
                  src="/icons/dashboard_icon.svg"
                  alt="Dashboard"
                />
                Dashboard
              </Link>
              <Link
                className={styles.option}
                to="#"
                onClick={closeDropdown}
              >
                <img
                  className={styles.optionIcon}
                  src="/icons/calendar_icon.svg"
                  alt="Calendar"
                />
                Calendar
              </Link>
              <Link
                className={styles.option}
                to="#"
                onClick={closeDropdown}
              >
                <img
                  className={styles.optionIcon}
                  src="/icons/messages_icon.svg"
                  alt="Messages"
                />
                Messages
              </Link>
            </div>
          </div>
          <Link
            className={styles.dropdownItem}
            to="/account/info"
            onClick={closeDropdown}
          >
            <img
              className={styles.dropdownIcon}
              src="/icons/person_icon.svg"
              alt="Account"
            />
            <p>Manage Account</p>
          </Link>
          <Link
            className={styles.dropdownItem}
            to="/account/wallet"
            onClick={closeDropdown}
          >
            <img
              className={styles.dropdownIcon}
              src="/icons/wallet_icon.svg"
              alt="Wallet"
            />
            <p>Wallet</p>
          </Link>
          <Link
            className={styles.dropdownItem}
            to="/help"
            onClick={closeDropdown}
          >
            <img
              className={styles.dropdownIcon}
              src="/icons/help_icon.svg"
              alt="Help"
            />
            <p>Help</p>
          </Link>
          <Link
            className={styles.dropdownItem}
            to="#"
            onClick={closeDropdown}
          >
            <img
              className={styles.feedbackIcon}
              src="/icons/feedback_icon.svg"
              alt="Feedback"
            />
            <p>Send Feedback</p>
          </Link>
          <div className={styles.logout}>
            <button
              className={styles.logoutButton}
              onClick={handleLogout}
              disabled={isLoggingOut}
            >
              {isLoggingOut ? "Logging out..." : "Log Out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileDropdown;
