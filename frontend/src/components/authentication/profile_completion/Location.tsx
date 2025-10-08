import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { StepComponentProps } from "../../../types/profileCompletion";

import RootMessage from "../../forms/fields/RootMessage";
import LocationSelect from "../../common/LocationSelect";

import { useBodyClass } from "../../../hooks/useBodyClass";
import styles from "../../../styles/authentication/ProfileCompletion.module.css";

const locationSchema = yup.object().shape({
  location: yup.string().optional().default(""),
});

// Form data type that matches the schema
interface LocationFormData {
  location: string;
}

// Extract just the properties this component needs
interface LocationData {
  location?: string;
  accountType?: string; // For conditional messaging
  locationSelectedFromDropdown?: boolean; // Track if location was selected from dropdown
}

interface LocationProps extends Pick<StepComponentProps, "onPrev"> {
  data: LocationData;
  onUpdate: (data: Partial<LocationData>) => void;
  onNext: (data?: Partial<LocationData>) => void;
  isFinal?: boolean;
}

const Location: React.FC<LocationProps> = ({
  data,
  onUpdate,
  onNext,
  onPrev,
  isFinal = false, // Default to false
}) => {
  useBodyClass("auth");

  // State for custom location error and dropdown selection tracking
  const [customError, setCustomError] = useState<string>("");
  const [wasSelectedFromDropdown, setWasSelectedFromDropdown] = useState(false);

  const form = useForm<LocationFormData>({
    resolver: yupResolver(locationSchema),
    mode: "onSubmit", // Only validate on submit, we'll handle custom validation manually
    defaultValues: {
      location: data.location || "",
    },
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    reset,
    watch,
    control,
  } = form;
  const locationValue = watch("location");

  // Helper function to determine button text
  const getButtonText = () => {
    if (isFinal) {
      return "Complete Profile";
    }
    return locationValue?.trim() ? "Next" : "Skip";
  };

  // Reset form when component mounts or data changes
  useEffect(() => {
    reset({ location: data.location || "" });
  }, [data.location, reset]);

  // Handle location selection changes
  const handleLocationChange = (
    _location: string,
    selectedFromDropdown: boolean
  ) => {
    setWasSelectedFromDropdown(selectedFromDropdown);
    // Persist the dropdown selection state to parent immediately
    onUpdate({ locationSelectedFromDropdown: selectedFromDropdown });
  };

  const handleFormSubmit = async (formData: LocationFormData) => {
    try {
      // Use the most up-to-date selection state (either from local state or parent data)
      const isSelectedFromDropdown =
        wasSelectedFromDropdown || data.locationSelectedFromDropdown;

      // Custom validation: if there's a location value but it wasn't selected from dropdown
      if (
        formData.location &&
        formData.location.trim() &&
        !isSelectedFromDropdown
      ) {
        setCustomError("Please select a location from the dropdown");
        return;
      }

      const locationData = {
        location: formData.location?.trim() || "",
        locationSelectedFromDropdown: isSelectedFromDropdown,
      };

      // Update data to persist the dropdown selection state
      onUpdate(locationData);

      // Pass location data directly to onNext for immediate submission
      onNext(locationData);
    } catch (error) {
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
        <p className={styles.p}>
          {data.accountType === "student"
            ? "Provide your location so you can easily find teachers in your area"
            : data.accountType === "teacher"
            ? "Provide your location so students in your area can find you"
            : "Provide your location so you can find teachers for your student easily"}
        </p>

        <form
          className={styles.form}
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
        >
          <RootMessage
            message={errors.root?.message}
            type="error"
            styles={{
              alert: styles.alert,
              span: styles.span,
            }}
          />

          <LocationSelect
            name="location"
            control={control}
            error={errors.location}
            customError={customError}
            label="Location (Optional)"
            onSelectionChange={handleLocationChange}
            onCustomError={setCustomError}
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
                {getButtonText()}
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
                {getButtonText()}
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

export default Location;
