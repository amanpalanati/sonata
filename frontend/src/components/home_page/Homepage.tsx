import React from "react";

import { useTitle } from "../../hooks/useTitle";

import Header from "./Header";
import Hero from "./Hero";
import Cards from "./Cards";
import Footer from "../common/Footer";

const Homepage: React.FC = () => {
  useTitle();

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
