import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./components/home_page/Homepage";
import About from "./components/About";
import Help from "./components/Help";
import Login from "./components/Login";
import AccountType from "./components/AccountType";
import SignUp from "./components/SignUp";
import Dashboard from "./components/Dashboard";
import Profile from "./components/Profile";

function App() {
  return (
    <Router>
      <div className="App">
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
