import React, { useState, useRef } from "react";

import { StepComponentProps } from "../../../types/profileCompletion";

import { useBodyClass } from "../../../hooks/useBodyClass";
import styles from "../../../styles/authentication/ProfileCompletion.module.css";

// Extract just the properties this component needs
interface ProfileImageData {
  profileImage?: File | null;
  profileImageUrl?: string;
}

interface ProfileImageProps
  extends Pick<StepComponentProps, "onNext" | "onPrev"> {
  data: ProfileImageData;
  onUpdate: (data: Partial<ProfileImageData>) => void;
}

const ProfileImage: React.FC<ProfileImageProps> = ({
  data,
  onUpdate,
  onNext,
  onPrev,
}) => {
  useBodyClass("auth");

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine which image to display
  const getDisplayImage = () => {
    // Priority: 1. Preview URL (newly uploaded), 2. Existing profileImage, 3. profileImageUrl, 4. Default
    if (previewUrl) return previewUrl;
    if (data.profileImage) return URL.createObjectURL(data.profileImage);
    if (data.profileImageUrl) return data.profileImageUrl;
    return "/images/default_pfp.png";
  };

  const handleFileSelect = (file: File) => {
    // Clear any previous errors
    setError(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, GIF)");
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError("File size must be less than 10MB");
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Update profile data
    onUpdate({
      profileImage: file,
      // Keep existing profileImageUrl if it exists (don't clear it)
    });
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault();
    setDragActive(false);
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleNext = () => {
    onNext();
  };

  const handleRemoveImage = (event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the file input
    setPreviewUrl(null);
    setError(null);
    onUpdate({
      profileImage: null,
      // Keep existing profileImageUrl if it exists
    });
  };

  // Clean up preview URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <>
      <div className={styles.wrapper}></div>
      <div className={styles.container}>
        <h1 className={styles.h1}>Profile Picture</h1>
        <p className={styles.p}>Choose a profile picture.</p>

        <div className={styles.form}>
          {/* Error message */}
          {error && <div className={styles.alert}>{error}</div>}

          {/* Profile Image Display and Upload Area */}
          <div
            className={`${styles.imageUploadContainer} ${
              dragActive ? styles.dragActive : ""
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={handleImageClick}
          >
            <div className={styles.imageContainer}>
              <img
                src={getDisplayImage()}
                alt="Profile"
                className={styles.profileImage}
              />
              {/* Show remove button only if there's a custom image (not default) */}
              {(previewUrl || data.profileImage || data.profileImageUrl) && (
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className={styles.removeButton}
                  title="Remove uploaded image"
                >
                  ×
                </button>
              )}
            </div>
            <p className={styles.uploadText}>
              Click to upload or drag and drop an image
            </p>
            <p className={styles.uploadSubtext}>JPG, PNG, GIF up to 10MB</p>
          </div>

          {/* Hidden file input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            style={{ display: "none" }}
          />

          {/* Navigation buttons */}
          {onPrev ? (
            <div className={styles.nextPrevDiv}>
              <button
                className={styles.prevNext}
                type="button"
                onClick={onPrev}
              >
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="19"
                  height="19"
                  className={styles.leftArrow}
                >
                  <path
                    d="M10 4 L16 10 L10 16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                Back
              </button>
              <button
                className={styles.prevNext}
                type="button"
                onClick={handleNext}
              >
                {previewUrl || data.profileImage || data.profileImageUrl
                  ? "Next"
                  : "Skip"}
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="18"
                  height="18"
                  className={styles.rightArrow}
                >
                  <path
                    d="M10 4 L16 10 L10 16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className={styles.nextDiv}>
              <button
                className={styles.prevNext}
                type="button"
                onClick={handleNext}
              >
                {previewUrl || data.profileImage || data.profileImageUrl
                  ? "Next"
                  : "Skip"}
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  width="18"
                  height="18"
                  className={styles.rightArrow}
                >
                  <path
                    d="M10 4 L16 10 L10 16"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfileImage;
