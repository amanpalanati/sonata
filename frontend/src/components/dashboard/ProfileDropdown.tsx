import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";

import ProfileImageDisplay from "./ProfileImageDisplay";

import styles from "../../styles/dashboard/ProfileDropdown.module.css";
import { authService } from "../../services/auth";

const ProfileDropdown: React.FC = () => {
  const { logoutAndRedirect, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
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
        setIsOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
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
      {isOpen && (
        <div className={styles.dropdownContent}>
          <div className={styles.dropdownHeader}>
            <div className={styles.imageWrapper}>
              <ProfileImageDisplay styles={styles} />
            </div>
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
                onClick={() => setIsOpen(false)}
              >
                <img
                  className={styles.optionIcon}
                  src="/icons/piano_icon.svg"
                  alt="student-icon"
                />
                Dashboard
              </Link>
              <Link
                className={styles.option}
                to="#"
                onClick={() => setIsOpen(false)}
              >
                <img
                  className={styles.optionIcon}
                  src="/icons/piano_icon.svg"
                  alt="student-icon"
                />
                Calendar
              </Link>
              <Link
                className={styles.option}
                to="#"
                onClick={() => setIsOpen(false)}
              >
                <img
                  className={styles.optionIcon}
                  src="/icons/piano_icon.svg"
                  alt="student-icon"
                />
                Messages
              </Link>
            </div>
          </div>
          <Link
            className={styles.dropdownItem}
            to="#"
            onClick={() => setIsOpen(false)}
          >
            <img
              className={styles.dropdownIcon}
              src="/icons/piano_icon.svg"
              alt="student-icon"
            />
            <p>Account Settings</p>
          </Link>
          <Link
            className={styles.dropdownItem}
            to="#"
            onClick={() => setIsOpen(false)}
          >
            <img
              className={styles.dropdownIcon}
              src="/icons/piano_icon.svg"
              alt="student-icon"
            />
            <p>Wallet</p>
          </Link>
          <Link
            className={styles.dropdownItem}
            to="#"
            onClick={() => setIsOpen(false)}
          >
            <img
              className={styles.dropdownIcon}
              src="/icons/piano_icon.svg"
              alt="student-icon"
            />
            <p>Help</p>
          </Link>
          <Link
            className={styles.dropdownItem}
            to="#"
            onClick={() => setIsOpen(false)}
          >
            <img
              className={styles.dropdownIcon}
              src="/icons/piano_icon.svg"
              alt="student-icon"
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
