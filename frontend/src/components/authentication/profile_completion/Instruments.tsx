import React, { useEffect } from "react";
import Select from "react-select";
import { useForm, Controller } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { StepComponentProps } from "../../../types/profileCompletion";
import GroupedInstruments from "../../../types/instruments";

import RootMessage from "../../forms/fields/RootMessage";

import { useBodyClass } from "../../../hooks/useBodyClass";
import styles from "../../../styles/authentication/ProfileCompletion.module.css";

const instrumentsSchema = yup.object().shape({
  instruments: yup
    .array()
    .of(yup.string().required())
    .min(1, "At least one instrument is required")
    .required("At least one instrument is required"),
});

// Form data type that matches the schema (required fields)
interface InstrumentsFormData {
  instruments: string[];
}

// Extract just the properties this component needs (optional for props)
interface InstrumentsData {
  instruments?: string[];
  accountType?: string; // For conditional messaging
}

interface InstrumentsProps
  extends Pick<StepComponentProps, "onNext" | "onPrev"> {
  data: InstrumentsData;
  onUpdate: (data: Partial<InstrumentsData>) => void;
}

const Instruments: React.FC<InstrumentsProps> = ({
  data,
  onUpdate,
  onNext,
  onPrev,
}) => {
  useBodyClass("auth");

  const form = useForm<InstrumentsFormData>({
    resolver: yupResolver(instrumentsSchema),
    defaultValues: {
      instruments: data.instruments || [],
    },
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
    control,
    reset,
  } = form;

  // Reset form when component mounts or data changes
  useEffect(() => {
    reset({
      instruments: data.instruments || [],
    });
  }, [data.instruments, reset]);

  const handleFormSubmit = async (formData: InstrumentsFormData) => {
    try {
      // Update parent state with current values (always update, even if empty)
      onUpdate({
        instruments: formData.instruments,
      });
      onNext();
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
        <p className={styles.p}>
          {data.accountType === "student"
            ? "Choose the instrument(s) you want to learn"
            : data.accountType === "teacher"
            ? "Choose the instrument(s) you want to teach"
            : "Choose the instrument(s) your child wants to learn"}
        </p>

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
          <Controller // Use Controller to connect react-select with react-hook-form
            name="instruments"
            control={control}
            render={({ field }) => {
              // Convert string values back to option objects for react-select
              const selectedOptions = Array.isArray(field.value)
                ? GroupedInstruments.flatMap((group) => group.options).filter(
                    (option) => field.value.includes(option.value)
                  )
                : [];

              return (
                <Select
                  id="instruments"
                  options={GroupedInstruments}
                  isMulti
                  placeholder="Select instruments..."
                  value={selectedOptions}
                  onChange={(selectedOptions) => {
                    const values = selectedOptions
                      ? selectedOptions.map((option) => option.value)
                      : [];
                    field.onChange(values);

                    // Update parent state immediately when user makes changes
                    onUpdate({
                      instruments: values,
                    });
                  }}
                  onBlur={field.onBlur}
                  name={field.name}
                  styles={{
                    control: (provided) => ({
                      ...provided,
                      minHeight: "48px",
                    }),
                  }}
                />
              );
            }}
          />
          <div
            className={
              errors.instruments ? styles.errorVisible : styles.errorHidden
            }
          >
            <span className={styles.span}>&#9888;</span>
            {errors.instruments?.message || "\u00A0"}
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
                  stroke-width="2"
                  width="19"
                  height="19"
                  className={styles.leftArrow}
                >
                  <path
                    d="M10 4 L16 10 L10 16"
                    stroke-linecap="round"
                    stroke-linejoin="round"
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
                  stroke-width="2"
                  width="18"
                  height="18"
                  className={styles.rightArrow}
                >
                  <path
                    d="M10 4 L16 10 L10 16"
                    stroke-linecap="round"
                    stroke-linejoin="round"
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
                  stroke-width="2"
                  width="18"
                  height="18"
                  className={styles.rightArrow}
                >
                  <path
                    d="M10 4 L16 10 L10 16"
                    stroke-linecap="round"
                    stroke-linejoin="round"
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

export default Instruments;
