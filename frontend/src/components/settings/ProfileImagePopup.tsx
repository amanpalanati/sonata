import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";

import styles from "../../styles/settings/ProfileImagePopup.module.css";

interface ProfileImagePopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentImage?: File | null;
  currentImageUrl?: string;
  onImageUpdate: (file: File | null, previewUrl: string | null) => void;
}

const ProfileImagePopup: React.FC<ProfileImagePopupProps> = ({
  isOpen,
  onClose,
  currentImage,
  currentImageUrl,
  onImageUpdate,
}) => {
  const { user } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset internal state when popup opens
  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(null);
      setSelectedFile(null);
      setImageRemoved(false);
      setError(null);
      setIsClosing(false);
    }
  }, [isOpen]);

  // Handle fade-out animation
  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
    }
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  // Determine which image to display - prioritize internal preview over current props
  const getDisplayImage = () => {
    // If user explicitly removed the image in this session, show default
    if (imageRemoved) return "/images/default_pfp.png";

    // If there's a new preview from file upload in this session, show it (highest priority)
    if (previewUrl) return previewUrl;

    // If current image URL indicates removal, show default
    if (currentImageUrl === "__REMOVED_IMAGE__")
      return "/images/default_pfp.png";

    // Fall back to current image props
    if (currentImage) return URL.createObjectURL(currentImage);
    if (currentImageUrl && currentImageUrl !== "__DEFAULT_IMAGE__") {
      return currentImageUrl;
    }
    if (user?.profile_image && user.profile_image !== "__DEFAULT_IMAGE__") {
      return user.profile_image;
    }
    return "/images/default_pfp.png";
  };

  const handleFileSelect = (file: File) => {
    setError(null);

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file (JPG, PNG, GIF)");
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      //5MB
      setError("File size must be less than 5MB");
      return;
    }

    // Create preview URL and store file internally (don't update parent yet)
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
    setImageRemoved(false); // Reset removed state when new file is selected
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => {
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveImage = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    setImageRemoved(true); // Mark image as explicitly removed
    setError(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setPreviewUrl(null);
      setSelectedFile(null);
      setImageRemoved(false);
      setError(null);
      onClose();
    }, 300); // Match animation duration
  };

  const handleDone = () => {
    // Only update parent component when Done is clicked
    if (imageRemoved) {
      // User removed the image - send null to reset to default
      onImageUpdate(null, null);
    } else if (selectedFile) {
      // User selected a new file
      onImageUpdate(selectedFile, previewUrl);
    }
    // If neither removed nor new file, don't update (no changes)
    handleClose();
  };

  const displayImage = getDisplayImage();

  // Show remove button only if the current display image is NOT the default image
  const isDefaultImage = displayImage === "/images/default_pfp.png";
  const showRemoveButton = !imageRemoved && !isDefaultImage;

  return (
    <div
      className={`${styles.popupOverlay} ${isClosing ? styles.closing : ""}`}
      onClick={handleClose}
    >
      <div
        className={`${styles.popupContainer} ${
          isClosing ? styles.closing : ""
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className={styles.closeButton} onClick={handleClose}>
          ×
        </button>

        <div className={styles.popupContent}>
          <h1 className={styles.title}>Update Profile Picture</h1>

          {error && <div className={styles.errorMessage}>{error}</div>}

          <div
            className={`${styles.imageUploadContainer} ${
              dragActive ? styles.dragActive : ""
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <div className={styles.imageContainer}>
              <img
                src={displayImage}
                alt="Profile"
                className={styles.profileImage}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/images/default_pfp.png";
                }}
              />
              {showRemoveButton && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveImage();
                  }}
                  className={styles.removeButton}
                  title="Remove image"
                >
                  ×
                </button>
              )}
            </div>
            <p className={styles.uploadText}>
              Click to upload or drag and drop an image
            </p>
            <p className={styles.uploadSubtext}>JPG, PNG, GIF up to 5MB</p>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInputChange}
            className={styles.hiddenInput}
          />

          <div className={styles.buttonContainer}>
            <button
              type="button"
              className={styles.button}
              onClick={handleClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className={styles.button}
              onClick={handleDone}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileImagePopup;
