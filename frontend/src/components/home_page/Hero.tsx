import React, { useState } from "react";

import "../../styles/home_page/page.css";

const Hero: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
    console.log("Searching for:", searchQuery);
  };

  return (
    <section className="hero">
      <h1 className="home-hero-title">Learn music with app-name</h1>
      <p>Connect students with teachers for music lessons</p>
      <form
        className="search-bar"
        onSubmit={handleSearch}
      >
        <input
          className="search-input"
          type="text"
          placeholder="Search for a music teacher"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button type="submit">Search</button>
      </form>
    </section>
  );
};

export default Hero;
