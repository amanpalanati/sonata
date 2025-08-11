import React, { useEffect, useState } from "react";

import { useAuth } from "../../contexts/AuthContext";

const ProfileImageDisplay: React.FC<{ styles: Record<string, string> }> = ({
  styles,
}) => {
  const { user } = useAuth();
  const [imageKey, setImageKey] = useState(0); // Force image re-render
  const [imageLoaded, setImageLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);

  // Force image reload when user profile updates
  useEffect(() => {
    setImageKey((prev) => prev + 1);
    setImageLoaded(false);
    setShowFallback(false);
  }, [user?.profile_image]);

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
    <div>
      <img
        key={imageKey}
        src={getProfileImageSrc()}
        alt="profile picture"
        className={styles.profileImage}
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
    </div>
  );
};

export default ProfileImageDisplay;
