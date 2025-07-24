import React from "react";

import Header from "./Header";
import Hero from "./Hero";
import Cards from "./Cards";
import Footer from "./Footer";

const Homepage: React.FC = () => {
  // Authentication is now handled at the route level in App.tsx
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
