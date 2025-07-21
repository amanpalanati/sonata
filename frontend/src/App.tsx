import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";

import { useAuth } from "./hooks/useAuth";

import Homepage from "./components/home_page/Homepage";
import About from "./components/about/About";
import Help from "./components/about/Help";
import Login from "./components/signup_login/Login";
import AccountType from "./components/signup_login/AccountType";
import SignUp from "./components/signup_login/SignUp";
import Dashboard from "./components/dashboard/Dashboard";
import Profile from "./components/dashboard/Profile";

// Component to validate session on route changes
const SessionValidator: React.FC = () => {
  const location = useLocation();
  const { validateSession, isAuthenticated } = useAuth();

  useEffect(() => {
    // Only validate session if user appears to be authenticated
    if (isAuthenticated) {
      validateSession();
    }
  }, [location.pathname, isAuthenticated, validateSession]);

  return null;
};

function App() {
  return (
    <Router>
      <div className="App">
        <SessionValidator />
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/about" element={<About />} />
          <Route path="/help" element={<Help />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<AccountType />} />
          <Route path="/signup/:accountType" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
