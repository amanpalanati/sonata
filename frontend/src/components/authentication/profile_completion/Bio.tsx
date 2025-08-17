import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { StepComponentProps } from "../../../types/profileCompletion";

import TextAreaField from "../../forms/fields/TextAreaField";
import RootMessage from "../../forms/fields/RootMessage";

import { useBodyClass } from "../../../hooks/useBodyClass";
import styles from "../../../styles/authentication/ProfileCompletion.module.css";

// Validation schema
const bioSchema = yup.object().shape({
  bio: yup.string().default(""),
});

// Form data type that matches the schema
interface BioFormData {
  bio: string;
}

// Extract just the properties this component needs (optional for props)
interface BioData {
  bio?: string;
}

interface BioProps extends Pick<StepComponentProps, "onPrev"> {
  data: BioData;
  onUpdate: (data: Partial<BioData>) => void;
  onNext: (data?: Partial<BioData>) => void;
}

const Bio: React.FC<BioProps> = ({ data, onUpdate, onNext, onPrev }) => {
  useBodyClass("auth");

  const form = useForm<BioFormData>({
    resolver: yupResolver(bioSchema),
    defaultValues: {
      bio: data.bio || "",
    },
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
    register,
  } = form;

  // Reset form when component mounts or data changes
  useEffect(() => {
    reset({
      bio: data.bio || "",
    });
  }, [data.bio, reset]);

  const handleFormSubmit = async (formData: BioFormData) => {
    try {
      const bioData = { bio: formData.bio.trim() };
      
      // Update parent state with current values
      onUpdate(bioData);
            
      // Pass bio data directly to onNext for final submission
      onNext(bioData);
    } catch (error) {
      // Handle any errors
      if (error instanceof Error) {
        setError("root", { type: "manual", message: error.message });
      } else {
        setError("root", {
          type: "manual",
          message: "An unexpected error occurred. Please try again.",
        });
      }
    }
  };

  return (
    <>
      <div className={styles.wrapper}></div>
      <div className={styles.container}>
        <h1 className={styles.h1}>Complete Your Profile</h1>
        <p className={styles.p}>Tell us about yourself.</p>

        <form
          className={styles.form}
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
        >
          {/* Root error for API errors */}
          <RootMessage
            message={errors.root?.message}
            type="error"
            styles={{
              alert: styles.alert,
              span: styles.span,
            }}
          />

          {/* Form Fields */}
          <TextAreaField
            id="bio"
            label="Bio"
            placeholder="What you hope to accomplish as a music teacher..."
            register={register("bio")}
            error={errors.bio}
            styles={styles}
            rows={3}
            maxRows={8}
            maxChar={500}
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
                type="submit"
                disabled={isSubmitting}
              >
                Complete Profile
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
                type="submit"
                disabled={isSubmitting}
              >
                Complete Profile
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
        </form>
      </div>
    </>
  );
};

export default Bio;
