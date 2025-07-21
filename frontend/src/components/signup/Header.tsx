import React from "react";
import { Link } from "react-router-dom";

import "../../styles/signup_login/header.css";

const Header: React.FC = () => {
  return (
    <header className="auth-header">
      <Link className="logo" to="/">
        <img src="" alt="app-name/logo" />
      </Link>
    </header>
  );
};

export default Header;
