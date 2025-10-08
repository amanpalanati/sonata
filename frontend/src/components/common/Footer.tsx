import React from "react";
import { Link } from "react-router-dom";
import styles from "../../styles/common/Footer.module.css";

const Footer: React.FC = () => {
  const year = new Date().getFullYear();
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        <Link to="/" className={styles.brand}>
        <img src="/images/logos/transparent-sonata.png" alt="Sonata" />
        </Link>

        <nav className={styles.links}>
          <Link to="/about">About</Link>
          <Link to="/help">Help</Link>
          <Link to="/terms">Terms</Link>
          <Link to="/privacy">Privacy</Link>
        </nav>

        <div className={styles.socials}>
          <a href="tel:+15551234567" aria-label="Phone">
            📞
          </a>
          <a
            href="https://facebook.com/yourpage"
            target="_blank"
            rel="noreferrer"
            aria-label="Facebook"
          >
            🌐
          </a>
          <a href="mailto:hello@sonata.app" aria-label="Email">
            ✉️
          </a>
        </div>
      </div>

      <div className={styles.bottom}>
        <span>© {year} Sonata — All rights reserved.</span>
      </div>
    </footer>
  );
};

export default Footer;
