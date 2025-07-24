import React from "react";

import { useAuth } from "../../contexts/AuthContext";

const Profile: React.FC = () => {
  const { user } = useAuth();

  // Authentication is now handled at the route level in App.tsx
  return (
    <div>
      <h1>Profile</h1>
      <p>
        Name: {user?.first_name} {user?.last_name}
      </p>
      <p>Email: {user?.email}</p>
      <p>Account Type: {user?.account_type}</p>
    </div>
  );
};

export default Profile;
