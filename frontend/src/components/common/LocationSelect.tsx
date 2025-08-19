import React, { useEffect, useState, useRef } from "react";
import { Control, Controller, FieldError } from "react-hook-form";

import FloatingLabelInput from "../forms/fields/FloatingLabelInput";

import styles from "../../styles/authentication/ProfileCompletion.module.css";

// Location suggestion from Nominatim API
interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

interface LocationSelectProps {
  name: string;
  control: Control<any>;
  error?: FieldError;
  customError?: string;
  placeholder?: string;
  label?: string;
  onSelectionChange?: (location: string, selectedFromDropdown: boolean) => void;
  onCustomError?: (error: string) => void;
  onFocus?: () => void;
}

const LocationSelect: React.FC<LocationSelectProps> = ({
  name,
  control,
  error,
  customError,
  label = "Location (Optional)",
  onSelectionChange,
  onCustomError,
  onFocus,
}) => {
  // State for location autocomplete
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(
    null
  );
  const [justSelected, setJustSelected] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Refs for handling clicks outside
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

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
        // Only show suggestions if the user is actively interacting (not on initial mount)
        if (!isInitialMount) {
          setShowSuggestions(rawData.length > 0);
        }
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
  const handleLocationSelect = (
    suggestion: LocationSuggestion,
    onChange: (value: string) => void
  ) => {
    setJustSelected(true);
    onChange(suggestion.display_name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setSuggestions([]);

    // Clear any custom error
    if (onCustomError) {
      onCustomError("");
    }

    if (inputRef.current) {
      inputRef.current.blur();
    }

    // Clear any pending search timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }

    // Notify parent of selection
    if (onSelectionChange) {
      onSelectionChange(suggestion.display_name, true);
    }
  };

  // Handle keyboard navigation
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
          // This will be handled by the Controller's onChange
        }
        break;

      case "Escape":
        e.preventDefault();
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        // Handle input change with debouncing
        useEffect(() => {
          // Clear existing timeout
          if (searchTimeout) {
            clearTimeout(searchTimeout);
          }

          // Don't search for empty values
          if (!field.value || !field.value.trim()) {
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
            fetchLocationSuggestions(field.value);
            // Mark that initial mount is complete after first interaction
            if (isInitialMount && (justSelected || isInputFocused)) {
              setIsInitialMount(false);
            }
          }, 300);

          setSearchTimeout(timeout);

          // Cleanup
          return () => {
            if (timeout) clearTimeout(timeout);
          };
        }, [field.value, justSelected, isInitialMount]);

        return (
          <div className={styles.locationInputWrapper}>
            {/* Search hint */}
            <div
              className={`${styles.locationSearchHint} ${
                isInputFocused && !field.value?.trim()
                  ? styles.visible
                  : styles.hidden
              }`}
            >
              Search for an address, city, or zip code...
            </div>

            <FloatingLabelInput
              id={name}
              label={label}
              type="text"
              placeholder=""
              register={{
                ...field,
                ref: (e: HTMLInputElement | null) => {
                  field.ref(e);
                  inputRef.current = e;
                },
                onInput: () => {
                  // Reset the justSelected flag when user manually types
                  if (justSelected) {
                    setJustSelected(false);
                  }
                  // Clear custom error when user starts typing again
                  if (customError && onCustomError) {
                    onCustomError("");
                  }
                  // Notify parent of manual input
                  if (onSelectionChange) {
                    onSelectionChange(field.value || "", false);
                  }
                },
                onFocus: () => {
                  setIsInputFocused(true);
                  // Clear custom error when user focuses back on input
                  if (customError && onCustomError) {
                    onCustomError("");
                  }
                  // Call parent onFocus handler if provided
                  if (onFocus) {
                    onFocus();
                  }
                  if (suggestions.length > 0 && !justSelected) {
                    setShowSuggestions(true);
                  }
                },
                onBlur: () => {
                  field.onBlur();
                  // Delay setting focus to false to allow for click events on suggestions
                  setTimeout(() => setIsInputFocused(false), 150);
                },
                onKeyDown: handleKeyDown,
              }}
              errors={
                error || (customError ? { message: customError } : undefined)
              }
              ariaInvalid={error || customError ? "true" : "false"}
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
                      onClick={() =>
                        handleLocationSelect(suggestion, field.onChange)
                      }
                      onMouseEnter={() => setHighlightedIndex(index)}
                      onMouseLeave={() => setHighlightedIndex(-1)}
                    >
                      {suggestion.display_name}
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Location error - maintain space even when no error */}
            <div
              className={
                error || customError ? styles.errorVisible : styles.errorHidden
              }
              style={{ marginBottom: "4px", minHeight: "20px" }}
            >
              <span className={styles.span}>&#9888;</span>
              {customError || error?.message || "\u00A0"}
            </div>
          </div>
        );
      }}
    />
  );
};

export default LocationSelect;
