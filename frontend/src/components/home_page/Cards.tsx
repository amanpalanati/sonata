import React from "react";
import { Link } from "react-router-dom";

import "../../styles/home_page/page.css";

const Cards: React.FC = () => {
  return (
    <section className="card-grid">
      <div className="card">
        <img src="/src/public/images/student.jpg" alt="Students" />
        <div className="card-text">
          <h2>For Students</h2>
          <p>
            Find music teachers who match your learning style and skill level.
          </p>
          <p className="underline">____________________</p>
          <Link className="sign-up-link" to="/signup/student">
            Get started
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="opposite-card-text">
          <h2>For Teachers</h2>
          <p>
            Grow your studio, set your availability, and&nbsp;get paid
            seamlessly.
          </p>
          <p className="underline">____________________</p>
          <Link className="sign-up-link" to="/signup/teacher">
            Get started
          </Link>
        </div>
        <img src="/src/public/images/teacher.jpg" alt="Teachers" />
      </div>

      <div className="card">
        <img src="/src/public/images/parent.jpg" alt="Parents" />
        <div className="card-text">
          <h2>For Parents</h2>
          <p>
            Manage your child's lessons, schedule, and payments all in one
            place.
          </p>
          <p className="underline">____________________</p>
          <Link className="sign-up-link" to="/signup/parent">
            Get started
          </Link>
        </div>
      </div>
    </section>
  );
};

export default Cards;
