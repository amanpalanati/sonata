import React from "react";
import { Link } from "react-router-dom";

import styles from "../../styles/home_page/Cards.module.css";

const Cards: React.FC = () => {
  return (
    <section className={styles.cardGrid}>
      <div className={styles.card}>
        <img
          className={styles.img}
          src="/src/public/images/student.jpg"
          alt="Students"
        />
        <div className={styles.cardText}>
          <h2 className={styles.h2}>For Students</h2>
          <p className={styles.p}>
            Find music teachers who match your learning style and skill level.
          </p>
          <p className={styles.underline}>____________________</p>
          <Link className={styles.signUpLink} to="/signup/student">
            Get started
          </Link>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.oppositeCardText}>
          <h2 className={styles.h2}>For Teachers</h2>
          <p className={styles.p}>
            Grow your studio, set your availability, and&nbsp;get paid
            seamlessly.
          </p>
          <p className={styles.underline}>____________________</p>
          <Link className={styles.signUpLink} to="/signup/teacher">
            Get started
          </Link>
        </div>
        <img
          className={styles.img}
          src="/src/public/images/teacher.jpg"
          alt="Teachers"
        />
      </div>

      <div className={styles.card}>
        <img
          className={styles.img}
          src="/src/public/images/parent.jpg"
          alt="Parents"
        />
        <div className={styles.cardText}>
          <h2 className={styles.h2}>For Parents</h2>
          <p className={styles.p}>
            Manage your child's lessons, schedule, and payments all in one
            place.
          </p>
          <p className={styles.underline}>____________________</p>
          <Link className={styles.signUpLink} to="/signup/parent">
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Cards;
