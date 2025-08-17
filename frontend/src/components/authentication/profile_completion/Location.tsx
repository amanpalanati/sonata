import React, { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { StepComponentProps } from "../../../types/profileCompletion";

import RootMessage from "../../forms/fields/RootMessage";
import FloatingLabelInput from "../../forms/fields/FloatingLabelInput";

import { useBodyClass } from "../../../hooks/useBodyClass";
import styles from "../../../styles/authentication/ProfileCompletion.module.css";

// Location suggestion from Nominatim API
interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

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
}

const Location: React.FC<LocationProps> = ({
  data,
  onUpdate,
  onNext,
  onPrev,
}) => {
  useBodyClass("auth");

  // State for location autocomplete
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [justSelected, setJustSelected] = useState(false);
  const [wasSelectedFromDropdown, setWasSelectedFromDropdown] = useState(
    data.locationSelectedFromDropdown || false
  );
  const [customError, setCustomError] = useState<string>("");
  const [isInputFocused, setIsInputFocused] = useState(false);

  // Refs for handling clicks outside
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine if this is the final step
  const isFinalStep = onNext.name === "handleFinalStep";

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
    register,
    setValue,
    watch,
    reset,
  } = form;
  const locationValue = watch("location");

  // Reset form when component mounts or data changes
  useEffect(() => {
    reset({ location: data.location || "" });
  }, [data.location, reset]);

  // Fetch location suggestions
  const fetchLocationSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoading(true);
    try {
      const apiUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=5&countrycodes=us,ca,mx&addressdetails=1`;
      const response = await fetch(apiUrl);

      if (response.ok) {
        const rawData: LocationSuggestion[] = await response.json();
        setSuggestions(rawData);
        setShowSuggestions(rawData.length > 0);
        setHighlightedIndex(-1);
      }
    } catch (error) {
      console.error("Error fetching location suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  useEffect(() => {
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Don't search for empty values
    if (!locationValue || !locationValue.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    // Don't search if we just selected a location
    if (justSelected) {
      return;
    }

    // Set new timeout for search
    const timeout = setTimeout(() => {
      fetchLocationSuggestions(locationValue);
    }, 300);

    setSearchTimeout(timeout);

    // Cleanup
    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [locationValue, justSelected]);

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  // Handle selecting a location suggestion
  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    setJustSelected(true);
    setValue("location", suggestion.display_name, { shouldValidate: true });
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setSuggestions([]);
    // Mark that location was selected from dropdown
    setWasSelectedFromDropdown(true);
    // Persist the dropdown selection state to parent immediately
    onUpdate({ locationSelectedFromDropdown: true });
    // Clear any custom error
    setCustomError("");
    if (inputRef.current) {
      inputRef.current.blur();
    }
    
    // Clear any pending search timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
  };  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;

      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;

      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
          handleLocationSelect(suggestions[highlightedIndex]);
        }
        break;

      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleFormSubmit = async (formData: LocationFormData) => {
    try {
      // Use the most up-to-date selection state (either from local state or parent data)
      const isSelectedFromDropdown = wasSelectedFromDropdown || data.locationSelectedFromDropdown;
      
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

          <div className={styles.locationInputWrapper}>
            {/* Search hint */}
            <div
              className={`${styles.locationSearchHint} ${
                isInputFocused && !locationValue?.trim()
                  ? styles.visible
                  : styles.hidden
              }`}
            >
              Search for an address, city, or zip code...
            </div>

            <FloatingLabelInput
              id="location"
              label="Location (Optional)"
              type="text"
              placeholder=""
              register={{
                ...register("location"),
                ref: (e: HTMLInputElement | null) => {
                  register("location").ref(e);
                  inputRef.current = e;
                },
                onInput: () => {
                  // Reset the justSelected flag when user manually types
                  if (justSelected) {
                    setJustSelected(false);
                  }
                  // Clear custom error when user starts typing again
                  if (customError) {
                    setCustomError("");
                  }
                  // Mark as not selected from dropdown when user manually types
                  setWasSelectedFromDropdown(false);
                  // Persist the state change to parent immediately
                  onUpdate({ locationSelectedFromDropdown: false });
                },
                onFocus: () => {
                  setIsInputFocused(true);
                  // Clear custom error when user focuses back on input
                  if (customError) {
                    setCustomError("");
                  }
                  if (suggestions.length > 0 && !justSelected) {
                    setShowSuggestions(true);
                  }
                },
                onBlur: () => {
                  // Delay setting focus to false to allow for click events on suggestions
                  setTimeout(() => setIsInputFocused(false), 150);
                },
                onKeyDown: handleKeyDown,
              }}
              errors={
                errors.location ||
                (customError ? { message: customError } : undefined)
              }
              ariaInvalid={errors.location || customError ? "true" : "false"}
            />

            {/* Location Suggestions */}
            {showSuggestions && (
              <div ref={suggestionsRef} className={styles.locationSuggestions}>
                {isLoading ? (
                  <div className={styles.loading}>Loading...</div>
                ) : suggestions.length === 0 ? (
                  <div className={styles.loading}>No locations found</div>
                ) : (
                  suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion.place_id}
                      className={`${styles.suggestions} ${
                        highlightedIndex === index ? styles.highlighted : ""
                      }`}
                      onClick={() => handleLocationSelect(suggestion)}
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onMouseLeave={() => setHighlightedIndex(-1)}
                    >
                      {suggestion.display_name}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Location error */}
          <div
            className={
              errors.location || customError
                ? styles.errorVisible
                : styles.errorHidden
            }
            style={{ marginTop: "-22px", marginBottom: "4px" }}
          >
            <span className={styles.span}>&#9888;</span>
            {customError || errors.location?.message || "\u00A0"}
          </div>

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
                {isFinalStep ? "Complete Profile" : "Next"}
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
                {isFinalStep ? "Complete Profile" : "Next"}
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
