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
    // If user is authenticated, redirect to dashboard
    if (!loading && isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, loading, navigate]);

  // Show loading while checking authentication
  if (loading) {
    return <></>;
  }

  // Only render homepage if user is not authenticated
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
