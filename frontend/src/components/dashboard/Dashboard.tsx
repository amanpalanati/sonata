import React, { useState, useEffect } from "react";

import { authService } from "../../services/auth";
import { useAuth } from "../../contexts/AuthContext";

const Dashboard: React.FC = () => {
  const { logoutAndRedirect, user } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [imageKey, setImageKey] = useState(0); // Force image re-render
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Force image reload when user profile updates
  useEffect(() => {
    setImageKey((prev) => prev + 1);
    setImageLoaded(false);
    setShowFallback(false);
  }, [user?.profile_image]);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple clicks

    setIsLoggingOut(true);

    try {
      // Clear backend session first
      await authService.logout();

      // Use the context method that handles redirect properly
      logoutAndRedirect("/");
    } catch (error) {
      console.error("Logout failed:", error);
      // Even if backend logout fails, still redirect
      logoutAndRedirect("/");
    }
  };

  // Handle the special marker case and image loading with fallback
  const getProfileImageSrc = () => {
    if (!user?.profile_image || user.profile_image === "__DEFAULT_IMAGE__") {
      return "/images/default_pfp.png";
    }

    // For custom images that might not be immediately available, show default until loaded
    if (!imageLoaded && !showFallback) {
      return "/images/default_pfp.png";
    }

    return user.profile_image;
  };

  return (
    <>
      <h1>Dashboard</h1>
      <p>Welcome, {user?.first_name}!</p>

      <p>Last name: {user?.last_name}</p>
      <p>Account type: {user?.account_type}</p>
      <p>Email: {user?.email}</p>

      <p>Child's first name: {user?.child_first_name || "Not provided"}</p>
      <p>Child's last name: {user?.child_last_name || "Not provided"}</p>
      <p>
        Profile image:
        <img
          key={imageKey}
          src={getProfileImageSrc()}
          alt="profile picture"
          style={{
            width: "120px",
            height: "120px",
            borderRadius: "50%",
            objectFit: "cover",
            border: "3px solid #f0f0f0",
          }}
          onLoad={() => {
            setImageLoaded(true);
          }}
          onError={(e) => {
            // If the custom image fails to load, show fallback
            if (
              !showFallback &&
              user?.profile_image &&
              user.profile_image !== "__DEFAULT_IMAGE__"
            ) {
              setShowFallback(true);
              // Try loading the actual custom image in the background
              const img = new Image();
              img.onload = () => {
                setImageLoaded(true);
                setShowFallback(false);
                setImageKey((prev) => prev + 1); // Force re-render with loaded image
              };
              img.onerror = () => {
                // If it still fails, just use fallback permanently
                (e.target as HTMLImageElement).src = "/images/default_pfp.png";
              };
              img.src = user.profile_image;
            } else {
              // Final fallback to default image
              (e.target as HTMLImageElement).src = "/images/default_pfp.png";
            }
          }}
        />
      </p>
      <p>Bio: {user?.bio || "Not provided"}</p>
      <p>
        Instruments:{" "}
        {user?.instruments?.length
          ? user.instruments.join(", ")
          : "Not provided"}
      </p>

      <p>Profile completed: {user?.profile_completed ? "Yes" : "No"}</p>

      <button onClick={handleLogout} disabled={isLoggingOut}>
        {isLoggingOut ? "Logging out..." : "Log Out"}
      </button>
    </>
  );
};

export default Dashboard;
