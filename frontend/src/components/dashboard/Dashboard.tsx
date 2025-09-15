import React from "react";
import TeachersList from "./TeachersList";
import { useAuth } from "../../contexts/AuthContext";
import { useTitle } from "../../hooks/useTitle";



const Dashboard: React.FC = () => {
  useTitle("Dashboard");

  const { user } = useAuth();

  return (
    <>
      
      <h1>Dashboard</h1>

      <p>Child's first name: {user?.child_first_name || "Not provided"}</p>
      <p>Child's last name: {user?.child_last_name || "Not provided"}</p>
      <p>
        Instruments:{" "}
        {user?.instruments?.length
          ? user.instruments.join(", ")
          : "Not provided"}
      </p>
      <p>Location: {user?.location || "Not provided"}</p>
      <p>Bio: {user?.bio || "Not provided"}</p>

      <p>Profile completed: {user?.profile_completed ? "Yes" : "No"}</p>
      <TeachersList />   
      
    </>
  );
};

export default Dashboard;


