import React, { useState } from "react";

import styles from "../../styles/home_page/Hero.module.css";

const Hero: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement search functionality
  };

  return (
    <section className={styles.hero}>
      <h1 className={styles.title}>Learn music with app-name</h1>
      <p>Connect students with teachers for music lessons</p>
      <form className={styles.searchBar} onSubmit={handleSearch}>
        <input
          className={styles.searchBarInput}
          type="text"
          placeholder="Search for a music teacher"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className={styles.searchBarButton} type="submit">
          Search
        </button>
      </form>
    </section>
  );
};

export default Hero;
