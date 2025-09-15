import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import OAuthCallback from "./components/authentication/OAuthCallback";
import ProtectedRoute from "./components/authentication/guards/ProtectedRouteGuard";
import PublicRoute from "./components/authentication/guards/PublicRouteGuard";
import ProfileGuard from "./components/authentication/guards/ProfileGuard";

import Homepage from "./components/home_page/Homepage";
import About from "./components/about/About";
import Help from "./components/help/Help";
import AccountType from "./components/authentication/AccountType";
import SignUp from "./components/authentication/SignUp";
import Login from "./components/authentication/Login";
import ForgotPassword from "./components/authentication/ForgotPassword";
import ResetPassword from "./components/forms/ResetPasswordForm";
import CompleteProfile from "./components/authentication/profile_completion/CompleteProfile";
import Dashboard from "./components/dashboard/Dashboard";
import Settings from "./components/settings/Settings";

/* ⬇️ add these */
import Header from "./components/common/Header";
import Footer from "./components/common/Footer";

const AppRoutes: React.FC = () => (
  <Routes>
    <Route path="/about" element={<About />} />
    <Route path="/help" element={<Help />} />
    <Route path="/auth/callback" element={<OAuthCallback />} />
    <Route path="/auth/callback/:accountType" element={<OAuthCallback />} />

    {/* Public */}
    <Route path="/" element={<PublicRoute><Homepage /></PublicRoute>} />
    <Route path="/signup" element={<PublicRoute><AccountType /></PublicRoute>} />
    <Route path="/signup/:accountType" element={<PublicRoute><SignUp /></PublicRoute>} />
    <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
    <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
    <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />

    {/* Protected */}
    <Route path="/complete-profile" element={
      <ProtectedRoute><CompleteProfile /></ProtectedRoute>
    } />
    <Route path="/dashboard" element={
      <ProtectedRoute><ProfileGuard><Dashboard /></ProfileGuard></ProtectedRoute>
    } />
    <Route path="/account/:settingsItem" element={
      <ProtectedRoute><ProfileGuard><Settings /></ProfileGuard></ProtectedRoute>
    } />
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          {/* ⬇️ global header */}
          <Header />
          {/* ⬇️ main grows and pushes footer down */}
          <main className="mainContent">
            <AppRoutes />
          </main>
          {/* ⬇️ global footer */}
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
