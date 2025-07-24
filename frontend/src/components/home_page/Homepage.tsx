import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../hooks/useAuth";

import Header from "./Header";
import Hero from "./Hero";
import Cards from "./Cards";
import Footer from "./Footer";

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Redirect authenticated users to dashboard
    if (!loading && isAuthenticated) {
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return <></>;
  }

  // Show homepage for unauthenticated users
  return (
    <>
      <Header />
      <Hero />
      <Cards />
      <Footer />
    </>
  );
};

export default Homepage;
