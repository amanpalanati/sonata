import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { useAuth } from "../../../contexts/AuthContext";
import { ProfileData, StepType } from "../../../types/profileCompletion";

import Header from "../Header";

// Import your step components (create these as needed)
// import NameEmail from "./NameEmail";
// import ChildName from "./ChildName";
// import ProfileImage from "./ProfileImage";
// import Bio from "./Bio";
// import Instruments from "./Instruments";

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

    // Pre-populate with existing data if available
    setProfileData((prev) => ({
      ...prev,
      firstName: user.first_name || "",
      lastName: user.last_name || "",
      email: user.email || "",
      ...(user.profile_image && { profileImageUrl: user.profile_image }),
    }));

    // Child name step - only for parents
    if (user.account_type === "parent") {
      steps.push("childName");
    }

    // Profile image step - always include (users can skip if they want)
    steps.push("pfp");

    // Bio and instruments - always include but content varies by account type
    steps.push("bio");
    steps.push("instruments");

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
        {/* Progress indicator */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          Step {currentStepIndex + 1} of {requiredSteps.length}
        </div>

        {/* Render current step component */}
        {currentStep === "nameEmail" && (
          <div>
            <h2>Complete Your Name and Email</h2>
            {/* <NameEmail 
              data={profileData}
              onUpdate={setProfileData}
              onNext={nextStep}
            /> */}
            <p>NameEmail component will go here</p>
            <p>Current data: {JSON.stringify(profileData)}</p>
            <button onClick={nextStep}>Next</button>
          </div>
        )}

        {currentStep === "childName" && (
          <div>
            <h2>Child's Information</h2>
            {/* <ChildName 
              data={profileData}
              onUpdate={setProfileData}
              onNext={nextStep}
              onPrev={prevStep}
            /> */}
            <p>ChildName component will go here</p>
            <button onClick={prevStep}>Back</button>
            <button onClick={nextStep}>Next</button>
          </div>
        )}

        {currentStep === "pfp" && (
          <div>
            <h2>Profile Picture</h2>
            {/* <ProfileImage 
              data={profileData}
              onUpdate={setProfileData}
              onNext={nextStep}
              onPrev={prevStep}
            /> */}
            <p>ProfileImage component will go here</p>
            <button onClick={prevStep}>Back</button>
            <button onClick={nextStep}>Next</button>
          </div>
        )}

        {currentStep === "bio" && (
          <div>
            <h2>Tell us about yourself</h2>
            {/* <Bio 
              accountType={user?.account_type}
              data={profileData}
              onUpdate={setProfileData}
              onNext={nextStep}
              onPrev={prevStep}
            /> */}
            <p>Bio component for {user?.account_type} will go here</p>
            <button onClick={prevStep}>Back</button>
            <button onClick={nextStep}>Next</button>
          </div>
        )}

        {currentStep === "instruments" && (
          <div>
            <h2>Instruments</h2>
            {/* <Instruments 
              accountType={user?.account_type}
              data={profileData}
              onUpdate={setProfileData}
              onNext={handleFinalStep}
              onPrev={prevStep}
            /> */}
            <p>Instruments component for {user?.account_type} will go here</p>
            <button onClick={prevStep}>Back</button>
            <button onClick={handleFinalStep}>Complete Profile</button>
          </div>
        )}
      </main>
    </>
  );
};

export default CompleteProfile;
