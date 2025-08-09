import React, { useState, useEffect } from "react";

import { authService } from "../../services/auth";
import { useAuth } from "../../contexts/AuthContext";

import Header from "./Header";
import Footer from "./Footer";

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <>
      <Header />
      <h1>Dashboard</h1>

      <p>Child's first name: {user?.child_first_name || "Not provided"}</p>
      <p>Child's last name: {user?.child_last_name || "Not provided"}</p>
      <p>Bio: {user?.bio || "Not provided"}</p>
      <p>
        Instruments:{" "}
        {user?.instruments?.length
          ? user.instruments.join(", ")
          : "Not provided"}
      </p>
      <p>Profile completed: {user?.profile_completed ? "Yes" : "No"}</p>
      {/* <Footer /> */}
    </>
  );
};

export default Dashboard;
