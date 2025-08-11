import React from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as yup from "yup";

import { StepComponentProps } from "../../../types/profileCompletion";
import { useFormFieldManagement } from "../../../hooks/useFormFieldManagement";

import FormField from "../../forms/fields/FormField";
import RootMessage from "../../forms/fields/RootMessage";

import { useBodyClass } from "../../../hooks/useBodyClass";
import styles from "../../../styles/authentication/ProfileCompletion.module.css";

// Validation schema
const childNameSchema = yup.object().shape({
  childFirstName: yup
    .string()
    .required("Child's first name is required")
    .trim(),
  childLastName: yup.string().required("Child's last name is required").trim(),
});

// Form data type that matches the schema (required fields)
interface ChildNameFormData {
  childFirstName: string;
  childLastName: string;
}

// Extract just the properties this component needs (optional for props)
interface ChildNameData {
  childFirstName?: string;
  childLastName?: string;
}

interface ChildNameProps extends Pick<StepComponentProps, "onNext" | "onPrev"> {
  data: ChildNameData;
  onUpdate: (data: Partial<ChildNameData>) => void;
}

const ChildName: React.FC<ChildNameProps> = ({
  data,
  onUpdate,
  onNext,
  onPrev,
}) => {
  useBodyClass("auth");

  const form = useForm<ChildNameFormData>({
    resolver: yupResolver(childNameSchema),
    defaultValues: {
      childFirstName: data.childFirstName || "",
      childLastName: data.childLastName || "",
    },
  });

  const {
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = form;

  // Use the custom hook for field management
  const { customRegister } = useFormFieldManagement({
    form,
  });

  const handleFormSubmit = async (formData: ChildNameFormData) => {
    try {
      // Update parent state with current values
      onUpdate({
        childFirstName: formData.childFirstName.trim(),
        childLastName: formData.childLastName.trim(),
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
        <p className={styles.p}>Please provide your child's name.</p>

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
                Next
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
                Next
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

export default ChildName;
