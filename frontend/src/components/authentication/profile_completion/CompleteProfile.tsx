import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";

import { useAuth } from "../../../contexts/AuthContext";
import { ProfileData, StepType } from "../../../types/profileCompletion";

import Header from "../Header";
import NameEmail from "./NameEmail";
import ChildName from "./ChildName";
import Instruments from "./Instruments";
import ProfileImage from "./ProfileImage";
import Location from "./Location";
import Bio from "./Bio";
import Submitting from "./Submitting";

import styles from "../../../styles/authentication/ProfileCompletion.module.css";

const CompleteProfile: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  // Profile completion state
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [requiredSteps, setRequiredSteps] = useState<StepType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCompleting, setShowCompleting] = useState(false);

  // State to set animation direction
  const [direction, setDirection] = useState<"forward" | "backward">("forward");

  // Determine which steps are needed based on user data and account type
  useEffect(() => {
    if (!user) return;

    const steps: StepType[] = [];

    // Always check name/email - only include if missing
    if (!user.first_name || !user.last_name || !user.email) {
      steps.push("nameEmail");
    }

    // Child name step - only for parents
    if (user.account_type === "parent") {
      steps.push("childName");
    }

    // Instruments step - always include but content varies by account type
    steps.push("instruments");

    // Profile image step - always included
    steps.push("pfp");

    // Location step - always include but content varies by account type
    steps.push("location");

    // Bio - only for teachers
    if (user.account_type === "teacher") {
      steps.push("bio");
    }

    // Pre-populate with existing user data (only if profileData is empty)
    setProfileData((prev) => {
      // Populate data that users entered in profile completion components
      if (Object.keys(prev).length > 0) {
        return prev;
      }

      // Initial population from user data before rendering steps
      return {
        firstName: user.first_name || "",
        lastName: user.last_name || "",
        email: user.email || "",
        ...(user.profile_image && { profileImageUrl: user.profile_image }),
        accountType: user.account_type, // For conditional messaging
      };
    });

    setRequiredSteps(steps);
    setIsLoading(false);
  }, [user]);

  // Navigation functions
  const nextStep = () => {
    if (currentStepIndex < requiredSteps.length - 1) {
      setDirection("forward");
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setDirection("backward");
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // Submit complete profile to backend
  const submitProfile = async () => {
    try {
      setShowCompleting(true);

      const formData = new FormData();

      // Add text fields
      Object.entries(profileData).forEach(([key, value]) => {
        if (key === "profileImage" && value instanceof File) {
          formData.append("profileImage", value);
        } else if (key === "instruments" && Array.isArray(value)) {
          formData.append("instruments", JSON.stringify(value));
        } else if (key === "profileImageUrl") {
          // Always send profileImageUrl, even if empty (indicates user wants default)
          formData.append(key, String(value || ""));
        } else if (value !== undefined && value !== null && value !== "") {
          formData.append(key, String(value));
        }
      });

      const response = await fetch("/api/complete-profile", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to complete profile");
      }

      // Get the updated user data from the response
      const updatedUser = await response.json();

      // Update the auth context with all the new profile data
      updateUserProfile({
        profile_completed: true,
        first_name: profileData.firstName || user?.first_name,
        last_name: profileData.lastName || user?.last_name,
        email: profileData.email || user?.email,
        ...(profileData.childFirstName && {
          child_first_name: profileData.childFirstName,
        }),
        ...(profileData.childLastName && {
          child_last_name: profileData.childLastName,
        }),
        ...(profileData.instruments && {
          instruments: profileData.instruments,
        }),
        // Backend will always provide a profile_image (either uploaded or default)
        profile_image: updatedUser.profile_image,
        ...(profileData.location && { location: profileData.location }),
        ...(profileData.bio && { bio: profileData.bio }),
      });

      // Add a small delay to allow the success animation to show
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Profile completed successfully - redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Profile completion error:", error);
      setShowCompleting(false);
      // Handle error (show toast, etc.)
    }
  };

  // Handle final step completion
  const handleFinalStep = async () => {
    if (currentStepIndex === requiredSteps.length - 1) {
      // Trigger the slide-out animation and then submit
      setDirection("forward");
      await new Promise((resolve) => setTimeout(resolve, 250)); // Wait for exit animation
      await submitProfile();
    } else {
      setDirection("forward");
      nextStep();
    }
  };

  if (isLoading) {
    return (
      <>
        <Header />
      </>
    );
  }

  // If profile is already completed, redirect to dashboard
  if (user && user.profile_completed) {
    navigate("/dashboard");
    return null;
  }

  if (requiredSteps.length === 0) {
    // Profile is already complete, redirect to dashboard
    navigate("/dashboard");
    return null;
  }

  const currentStep = requiredSteps[currentStepIndex];

  // Animation variants based on direction
  const slideVariants = {
    initial: (direction: "forward" | "backward") => ({
      opacity: 0,
      x: direction === "forward" ? 50 : -50,
    }),
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: (direction: "forward" | "backward") => ({
      opacity: 0,
      x: direction === "forward" ? -50 : 50,
    }),
  };

  // Show completing state if submission is in progress
  if (showCompleting) {
    return (
      <>
        <Header />
        <main>
          <div className={styles.outer}>
            <motion.div
              className={styles.step}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Submitting />
            </motion.div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Header />
      <main>
        {/* Render current step component */}
        <div className={styles.outer}>
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentStep}
              className={styles.step}
              custom={direction}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                duration: 0.25,
                ease: [0.25, 0.46, 0.45, 0.94], // Custom cubic-bezier for smooth motion
                opacity: { duration: 0.2 },
                x: { duration: 0.25 },
              }}
            >
              {currentStep === "nameEmail" && (
                <NameEmail
                  data={profileData}
                  onUpdate={(data) =>
                    setProfileData((prev) => ({ ...prev, ...data }))
                  }
                  onNext={nextStep}
                  onPrev={currentStepIndex > 0 ? prevStep : undefined}
                />
              )}

              {currentStep === "childName" && (
                <ChildName
                  data={profileData}
                  onUpdate={(data) =>
                    setProfileData((prev) => ({ ...prev, ...data }))
                  }
                  onNext={nextStep}
                  onPrev={currentStepIndex > 0 ? prevStep : undefined}
                />
              )}

              {currentStep === "instruments" && (
                <Instruments
                  data={{
                    ...profileData,
                    accountType: user?.account_type, // Add accountType from user
                  }}
                  onUpdate={(data) => {
                    setProfileData((prev) => ({ ...prev, ...data }));
                  }}
                  onNext={nextStep}
                  onPrev={currentStepIndex > 0 ? prevStep : undefined}
                />
              )}

              {currentStep === "pfp" && (
                <ProfileImage
                  data={profileData}
                  onUpdate={(data) =>
                    setProfileData((prev) => ({ ...prev, ...data }))
                  }
                  onNext={nextStep}
                  onPrev={currentStepIndex > 0 ? prevStep : undefined}
                />
              )}

              {currentStep === "location" && (
                <Location
                  data={profileData}
                  onUpdate={(data) =>
                    setProfileData((prev) => ({ ...prev, ...data }))
                  }
                  onNext={currentStepIndex === requiredSteps.length - 1 ? handleFinalStep : nextStep}
                  onPrev={currentStepIndex > 0 ? prevStep : undefined}
                />
              )}

              {currentStep === "bio" && (
                <Bio
                  data={profileData}
                  onUpdate={(data) =>
                    setProfileData((prev) => ({ ...prev, ...data }))
                  }
                  onNext={handleFinalStep}
                  onPrev={currentStepIndex > 0 ? prevStep : undefined}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </>
  );
};

export default CompleteProfile;
