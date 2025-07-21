import React from "react";
import { Link } from "react-router-dom";

import Header from "./Header";

import { useBodyClass } from "../../hooks/useBodyClass";
import "../../styles/signup_login/page.css";

const AccountType: React.FC = () => {
  useBodyClass("account-type-body");

  return (
    <>
      <Header />
      <div className="account-type-container">
        <h1 className="auth-h1">Choose Your Account Type</h1>
        <div className="account-types">
          <Link to="/signup/student" className="account-type-link">
            Student
          </Link>
          <Link to="/signup/teacher" className="account-type-link">
            Teacher
          </Link>
          <Link to="/signup/parent" className="account-type-link">
            Parent
          </Link>
        </div>
      </div>
    </>
  );
};

export default AccountType;
