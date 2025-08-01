import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

import OAuthCallback from "./components/authentication/OAuthCallback";
import ProtectedRoute from "./components/authentication/ProtectedRoute";
import PublicRoute from "./components/authentication/PublicRoute";
import ProfileGuard from "./components/authentication/ProfileGuard";

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
import Profile from "./components/dashboard/Profile";

const AppRoutes: React.FC = () => {
  return (
    <Routes>
      <Route path="/about" element={<About />} />
      <Route path="/help" element={<Help />} />
      <Route path="/auth/callback" element={<OAuthCallback />} />
      <Route path="/auth/callback/:accountType" element={<OAuthCallback />} />

      {/* Public routes - redirect to dashboard if authenticated */}
      <Route
        path="/"
        element={
          <PublicRoute>
            <Homepage />
          </PublicRoute>
        }
      />
      <Route
        path="/signup"
        element={
          <PublicRoute>
            <AccountType />
          </PublicRoute>
        }
      />
      <Route
        path="/signup/:accountType"
        element={
          <PublicRoute>
            <SignUp />
          </PublicRoute>
        }
      />
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      {/* Protected routes - redirect to login if not authenticated */}
      <Route
        path="/complete-profile"
        element={
          <ProtectedRoute>
            <CompleteProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <ProfileGuard>
              <Dashboard />
            </ProfileGuard>
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfileGuard>
              <Profile />
            </ProfileGuard>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <AppRoutes />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
