import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../contexts/AuthContext";
import { ProfileData, StepType } from "../../../types/profileCompletion";

import Header from "../Header";
import NameEmail from "./NameEmail";
import ChildName from "./ChildName";
import ProfileImage from "./ProfileImage";
import Bio from "./Bio";
import Instruments from "./Instruments";

const CompleteProfile: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const navigate = useNavigate();

  // Profile completion state
  const [profileData, setProfileData] = useState<ProfileData>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [requiredSteps, setRequiredSteps] = useState<StepType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

    // Profile image step (only if not already included with Google OAuth)
    if (!user.profile_image) {
      steps.push("pfp");
    }

    // Bio - only for teachers
    if (user.account_type === "teacher") {
      steps.push("bio");
    }

    // Instruments step - always include but content varies by account type
    steps.push("instruments");

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
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  // Submit complete profile to backend
  const submitProfile = async () => {
    try {
      const formData = new FormData();

      // Add text fields
      Object.entries(profileData).forEach(([key, value]) => {
        if (key === "profileImage" && value instanceof File) {
          formData.append("profileImage", value);
        } else if (key === "instruments" && Array.isArray(value)) {
          formData.append("instruments", JSON.stringify(value));
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

      // Mark profile as completed in the auth context
      updateUserProfile({ profile_completed: true });

      // Profile completed successfully - redirect to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Profile completion error:", error);
      // Handle error (show toast, etc.)
    }
  };

  // Handle final step completion
  const handleFinalStep = () => {
    if (currentStepIndex === requiredSteps.length - 1) {
      submitProfile();
    } else {
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

  return (
    <>
      <Header />
      <main>
        {/* Render current step component */}
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

        {currentStep === "bio" && (
          <Bio
            data={profileData}
            onUpdate={(data) =>
              setProfileData((prev) => ({ ...prev, ...data }))
            }
            onNext={nextStep}
            onPrev={prevStep}
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
            onNext={handleFinalStep}
            onPrev={prevStep}
          />
        )}
      </main>
    </>
  );
};

export default CompleteProfile;
