import React, { useEffect, useState } from "react";

import { useAuth } from "../../contexts/AuthContext";

const ProfileImageDisplay: React.FC<{ styles: Record<string, string> }> = ({
  styles,
}) => {
  const { user } = useAuth();
  const [imageSrc, setImageSrc] = useState("/images/default_pfp.png");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadProfileImage = async () => {
      // If no profile image or it's the default marker, use default
      if (!user?.profile_image || user.profile_image === "__DEFAULT_IMAGE__") {
        setImageSrc("/images/default_pfp.png");
        return;
      }

      // If it's the same image we already have, don't reload
      if (imageSrc === user.profile_image) {
        return;
      }

      setIsLoading(true);

      // Preload the image to avoid flickering
      const img = new Image();

      img.onload = () => {
        // Only update the src once the image has fully loaded
        setImageSrc(user.profile_image!);
        setIsLoading(false);
      };

      img.onerror = () => {
        // If the image fails to load, use default
        setImageSrc("/images/default_pfp.png");
        setIsLoading(false);
      };

      // Start loading the image
      img.src = user.profile_image;
    };

    loadProfileImage();
  }, [user?.profile_image, imageSrc]);

  return (
    <div>
      <img
        src={imageSrc}
        alt="profile picture"
        className={styles.profileImage}
        style={{
          opacity: isLoading ? 0.7 : 1,
          transition: "opacity 0.2s ease-in-out",
        }}
      />
    </div>
  );
};

export default ProfileImageDisplay;
