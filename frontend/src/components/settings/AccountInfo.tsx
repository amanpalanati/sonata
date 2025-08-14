import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";
import { useLocation, useNavigate } from "react-router-dom";

import { useAuth } from "../../contexts/AuthContext";
import { useFormFieldManagement } from "../../hooks/useFormFieldManagement";
import { authService } from "../../services/auth";
import { AccountInfoFormData } from "../../types";

import ProfileImagePopup from "./ProfileImagePopup";
import FormField from "../forms/fields/FormField";
import RootMessage from "../forms/fields/RootMessage";
import TextAreaField from "../forms/fields/TextAreaField";

import styles from "../../styles/settings/Settings.module.css";

// Validation schema
const createValidationSchema = (accountType?: string) => {
  const baseSchema = {
    firstName: yup
      .string()
      .required("First name is required")
      .min(2, "First name must be at least 2 characters")
      .max(50, "First name must be less than 50 characters")
      .trim(),
    lastName: yup
      .string()
      .required("Last name is required")
      .min(2, "Last name must be at least 2 characters")
      .max(50, "Last name must be less than 50 characters")
      .trim(),
    email: yup
      .string()
      .required("Email is required")
      .email("Please enter a valid email address")
      .max(100, "Email must be less than 100 characters")
      .trim(),
  };

  // Add conditional fields based on account type
  if (accountType === "parent") {
    return yup.object({
      ...baseSchema,
      childFirstName: yup
        .string()
        .required("Child's first name is required")
        .min(2, "Child's first name must be at least 2 characters")
        .max(50, "Child's first name must be less than 50 characters")
        .trim(),
      childLastName: yup
        .string()
        .required("Child's last name is required")
        .min(2, "Child's last name must be at least 2 characters")
        .max(50, "Child's last name must be less than 50 characters")
        .trim(),
    });
  }

  if (accountType === "teacher") {
    return yup.object({
      ...baseSchema,
      bio: yup
        .string()
        .max(500, "Bio must be less than 500 characters")
        .optional()
        .trim(),
    });
  }

  return yup.object(baseSchema);
};

const AccountInfo: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [profileImagePreview, setProfileImagePreview] = useState<string | null>(
    null
  );
  const [hasChanges, setHasChanges] = useState(false);

  // Check if popup should be open based on URL parameter
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Check URL parameters on mount and location change
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    if (searchParams.get("editProfileImage") === "true") {
      setIsPopupOpen(true);
      // Clean up URL parameter without page reload
      searchParams.delete("editProfileImage");
      const newUrl = `${location.pathname}${
        searchParams.toString() ? "?" + searchParams.toString() : ""
      }`;
      navigate(newUrl, { replace: true });
    }
  }, [location, navigate]);

  // Create validation schema based on user's account type
  const validationSchema = createValidationSchema(user?.account_type);

  const form = useForm<AccountInfoFormData>({
    resolver: yupResolver(validationSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      childFirstName: "",
      childLastName: "",
      bio: "",
    },
  });

  const {
    handleSubmit,
    formState: { errors },
    reset,
    setError,
    watch,
  } = form;
  const { customRegister } = useFormFieldManagement({ form });

  // Check if there are any field errors
  const hasFieldErrors = Object.keys(errors).some((key) => key !== "root");

  // Watch all form values to detect changes
  const watchedValues = watch();

  // Pre-populate form with user data when user changes
  useEffect(() => {
    if (user) {
      const defaultValues = {
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        childFirstName: user.child_first_name || "",
        childLastName: user.child_last_name || "",
        bio: user.bio || "",
      };
      reset(defaultValues);
      setHasChanges(false); // Reset changes when user data loads
    }
  }, [user, reset]);

  // Check for changes whenever form values change
  useEffect(() => {
    if (!user) return;

    const currentValues = {
      firstName: watchedValues.firstName || "",
      lastName: watchedValues.lastName || "",
      email: watchedValues.email || "",
      childFirstName: watchedValues.childFirstName || "",
      childLastName: watchedValues.childLastName || "",
      bio: watchedValues.bio || "",
    };

    const originalValues = {
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      email: user.email || "",
      childFirstName: user.child_first_name || "",
      childLastName: user.child_last_name || "",
      bio: user.bio || "",
    };

    // Check if any form values have changed from original
    const formHasChanges = Object.keys(currentValues).some(
      (key) =>
        currentValues[key as keyof typeof currentValues] !==
        originalValues[key as keyof typeof originalValues]
    );

    // Check if profile image has changed (either new file or explicitly removed)
    const imageHasChanges =
      profileImage !== null || profileImagePreview === "__REMOVED_IMAGE__";

    setHasChanges(formHasChanges || imageHasChanges);
  }, [watchedValues, user, profileImage, profileImagePreview]);

  // Add beforeunload warning when there are unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [hasChanges]);

  // Handle popup for profile image
  const handleOpenPopup = () => {
    setIsPopupOpen(true);
  };

  const handleClosePopup = () => {
    setIsPopupOpen(false);
  };

  const handlePopupImageUpdate = (
    file: File | null,
    previewUrl: string | null
  ) => {
    setProfileImage(file);
    // If file is null and previewUrl is null, user removed the image
    if (file === null && previewUrl === null) {
      setProfileImagePreview("__REMOVED_IMAGE__"); // Special marker for removed image
    } else {
      setProfileImagePreview(previewUrl);
    }
  };

  // Handle form submission
  const onSubmit = async (data: AccountInfoFormData) => {
    setIsSubmitting(true);

    try {
      const formData = new FormData();

      // Add text fields
      formData.append("firstName", data.firstName);
      formData.append("lastName", data.lastName);
      formData.append("email", data.email);

      if (user?.account_type === "parent") {
        formData.append("childFirstName", data.childFirstName || "");
        formData.append("childLastName", data.childLastName || "");
      }

      if (user?.account_type === "teacher" && data.bio) {
        formData.append("bio", data.bio);
      }

      // Handle profile image changes
      if (profileImage) {
        // User selected a new image
        formData.append("profileImage", profileImage);
      } else if (profileImagePreview === "__REMOVED_IMAGE__") {
        // User explicitly removed the image - send a special marker
        formData.append("removeProfileImage", "true");
      }

      // Call the update profile API endpoint using the auth service
      const result = await authService.updateProfile(formData);

      if (result.success) {
        // Update the auth context with new user data
        updateUserProfile({
          first_name: data.firstName,
          last_name: data.lastName,
          email: data.email,
          ...(user?.account_type === "parent" && {
            child_first_name: data.childFirstName,
            child_last_name: data.childLastName,
          }),
          ...(user?.account_type === "teacher" && {
            bio: data.bio,
          }),
          // Update profile image based on what happened
          ...(profileImage && { profile_image: result.profile_image }),
          ...(profileImagePreview === "__REMOVED_IMAGE__" && {
            profile_image: "__DEFAULT_IMAGE__",
          }),
        });

        // Clear the image selection and preview
        setProfileImage(null);
        setProfileImagePreview(null);
        setHasChanges(false); // Reset changes state after successful update

        setError("root", {
          type: "success",
          message: "Account information updated successfully!",
        });
      } else {
        setError("root", {
          message: result.error || "Failed to update account information",
        });
      }
    } catch (error) {
      console.error("Error updating account info:", error);
      setError("root", {
        message: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle cancel - reset form to original values
  const handleCancel = () => {
    if (user) {
      reset({
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        childFirstName: user.child_first_name || "",
        childLastName: user.child_last_name || "",
        bio: user.bio || "",
      });
      setProfileImage(null);
      setProfileImagePreview(null);
      setHasChanges(false); // Reset changes state when canceling
    }
  };

  return (
    <>
      <div className={styles.content}>
        <h1 className={styles.contentTitle}>Account Info</h1>

        <hr className={styles.divider} />
        <form onSubmit={handleSubmit(onSubmit)}>
          <RootMessage
            message={errors.root?.message}
            type="error"
            styles={{
              alert: styles.alert,
              span: styles.span,
            }}
          />
          <div className={styles.textFields}>
            <div className={styles.imageWrapper} onClick={handleOpenPopup}>
              <img
                src={
                  profileImagePreview === "__REMOVED_IMAGE__"
                    ? "/images/default_pfp.png"
                    : profileImagePreview ||
                      (user?.profile_image &&
                      user.profile_image !== "__DEFAULT_IMAGE__"
                        ? user.profile_image
                        : null) ||
                      "/images/default_pfp.png"
                }
                alt="Profile"
                className={styles.profileImage}
              />
              <div className={styles.editIcon}>
                <img src="/icons/edit_icon.svg" alt="Edit" />
              </div>
            </div>

            <div className={styles.textWrapper}>
              <div className={styles.textInputs}>
                <div className={styles.nameInputs}>
                  <FormField
                    id="firstName"
                    label="First Name"
                    type="text"
                    placeholder="First Name"
                    register={customRegister("firstName")}
                    error={errors.firstName}
                    styles={styles}
                  />

                  <FormField
                    id="lastName"
                    label="Last Name"
                    type="text"
                    placeholder="Last Name"
                    register={customRegister("lastName")}
                    error={errors.lastName}
                    styles={styles}
                  />
                </div>

                <FormField
                  id="email"
                  label="Email"
                  type="email"
                  placeholder="Email"
                  register={{
                    ...customRegister("email"),
                    disabled: true,
                    style: { cursor: "not-allowed" },
                  }}
                  error={errors.email}
                  styles={styles}
                />
              </div>
            </div>
          </div>

          {user?.account_type === "parent" && (
            <>
              <hr className={styles.subdivider} />

              <h2 className={styles.subTitle}>Child Name</h2>

              <div className={styles.childNameField}>
                <FormField
                  id="childFirstName"
                  label="Child's First Name"
                  type="text"
                  placeholder="Child's First Name"
                  register={customRegister("childFirstName")}
                  error={errors.childFirstName}
                  styles={styles}
                />

                <FormField
                  id="childLastName"
                  label="Child's Last Name"
                  type="text"
                  placeholder="Child's Last Name"
                  register={customRegister("childLastName")}
                  error={errors.childLastName}
                  styles={styles}
                />
              </div>
            </>
          )}

          {user?.account_type === "teacher" && (
            <>
              <hr className={styles.subdivider} />

              <h2 className={styles.subTitle}>Bio</h2>

              <div className={styles.bioField}>
                <TextAreaField
                  id=""
                  label=""
                  placeholder="What you hope to accomplish as a music teacher..."
                  register={customRegister("bio")}
                  error={errors.bio}
                  styles={styles}
                  rows={3}
                  maxRows={8}
                  maxChar={500}
                />
              </div>
            </>
          )}

          <hr className={styles.divider} />

          <div className={styles.buttonGroup}>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isSubmitting || !hasChanges || hasFieldErrors}
            >
              {isSubmitting ? "Saving..." : "Save"}
            </button>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={handleCancel}
              disabled={isSubmitting}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>

      <ProfileImagePopup
        isOpen={isPopupOpen}
        onClose={handleClosePopup}
        currentImage={profileImage}
        currentImageUrl={
          profileImagePreview === "__REMOVED_IMAGE__"
            ? "__REMOVED_IMAGE__"
            : profileImagePreview || user?.profile_image
        }
        onImageUpdate={handlePopupImageUpdate}
      />
    </>
  );
};

export default AccountInfo;
