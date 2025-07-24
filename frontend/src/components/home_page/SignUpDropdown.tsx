import React, { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

import styles from "../../styles/home_page/SignUpDropdown.module.css";

const SignUpDropdown: React.FC = () => {
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

  return (
    <div className={styles.dropdown} ref={dropdownRef}>
      <button
        className={styles.signUpButton}
        onClick={toggleDropdown}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        Sign Up
      </button>
      {isOpen && (
        <div className={styles.dropdownContent}>
          <Link
            className={styles.dropdownItem}
            to="/signup/student"
            onClick={() => setIsOpen(false)}
          >
            <p>Student</p>
            <img
              className={styles.icon}
              src="/src/public/icons/piano_icon.svg"
              alt="student-icon"
            />
          </Link>
          <Link
            className={styles.dropdownItem}
            to="/signup/teacher"
            onClick={() => setIsOpen(false)}
          >
            <p>Teacher</p>
            <img
              className={styles.icon}
              src="/src/public/icons/baton_icon.svg"
              alt="teacher-icon"
            />
          </Link>
          <Link
            className={styles.dropdownItem}
            to="/signup/parent"
            onClick={() => setIsOpen(false)}
          >
            <p>Parent</p>
            <img
              className={styles.parentIcon}
              src="/src/public/icons/person_heart_icon.svg"
              alt="parent-icon"
            />
          </Link>
        </div>
      )}
    </div>
  );
};

export default SignUpDropdown;
