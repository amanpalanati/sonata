import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Homepage from "./components/home_page/Homepage";
import About from "./components/about/About";
import Help from "./components/help/Help";
import Login from "./components/authentication/Login";
import AccountType from "./components/authentication/AccountType";
import SignUp from "./components/authentication/SignUp";
import Dashboard from "./components/dashboard/Dashboard";
import Profile from "./components/dashboard/Profile";
import OAuthCallback from "./components/authentication/OAuthCallback";

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
          <Route path="/auth/callback" element={<OAuthCallback />} />
          <Route
            path="/auth/callback/:accountType"
            element={<OAuthCallback />}
          />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
