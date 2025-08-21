import React from "react";

import Header from "./Header";
import Hero from "./Hero";
import Cards from "./Cards";
import Footer from "../common/Footer";

const Homepage: React.FC = () => {
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
