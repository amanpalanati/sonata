import React from "react";
import { Link } from "react-router-dom";

import "../../styles/home_page/header.css";

const Header: React.FC = () => {
  return (
    <header>
      <nav className="left">
        <Link className="logo" to="/">
          <img src="" alt="app-name/logo" />
        </Link>
        <Link className="left-nav-item" to="/signup/student">
          Learn
        </Link>
        <Link className="left-nav-item" to="/signup/teacher">
          Teach
        </Link>
        <Link className="left-nav-item" to="/about">
          About
        </Link>
      </nav>
      <nav className="right">
        <Link className="right-nav-item" to="/help">
          Help
        </Link>
        <Link className="right-nav-item" to="/login">
          Log In
        </Link>
        <Link className="sign-up" to="/signup">
          Sign Up
        </Link>
      </nav>
    </header>
  );
};

export default Header;
