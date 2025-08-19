import React from "react";
import Select from "react-select";
import {
  Control,
  Controller,
  FieldError,
  FieldErrorsImpl,
  Merge,
} from "react-hook-form";

import GroupedInstruments from "../../types/instruments";

import styles from "../../styles/authentication/ProfileCompletion.module.css";

interface InstrumentsSelectProps {
  name: string;
  control: Control<any>;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl<any>> | undefined;
  placeholder?: string;
  onSelectionChange?: (selectedInstruments: string[]) => void;
}

const InstrumentsSelect: React.FC<InstrumentsSelectProps> = ({
  name,
  control,
  error,
  placeholder = "Select instruments...",
  onSelectionChange,
}) => {
  return (
    <div>
      <Controller
        name={name}
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
              id={name}
              options={GroupedInstruments}
              isMulti
              placeholder={placeholder}
              value={selectedOptions}
              onChange={(selectedOptions) => {
                const values = selectedOptions
                  ? selectedOptions.map((option) => option.value)
                  : [];
                field.onChange(values);

                // Callback for parent to handle immediate updates
                if (onSelectionChange) {
                  onSelectionChange(values);
                }
              }}
              onBlur={field.onBlur}
              name={field.name}
              styles={{
                control: (provided) => ({
                  ...provided,
                  minHeight: "48px",
                  borderColor: error ? "#ef4444" : provided.borderColor,
                  "&:hover": {
                    borderColor: error ? "#ef4444" : "#d1d5db",
                  },
                }),
              }}
              aria-invalid={error ? "true" : "false"}
              aria-describedby={error ? `${name}-error` : undefined}
            />
          );
        }}
      />

      {/* Error message */}
      <div
        className={error ? styles.errorVisible : styles.errorHidden}
        id={`${name}-error`}
        role={error ? "alert" : undefined}
        style={{
          marginTop: "4px",
          minHeight: "20px",
          display: "flex",
          alignItems: "center",
          gap: "4px",
        }}
      >
        {error && (
          <span
            className={styles.span}
            style={{ marginTop: "-2px", marginRight: "2px" }}
          >
            &#9888;
          </span>
        )}
        {error?.message || (error as any)?.message || "\u00A0"}
      </div>
    </div>
  );
};

export default InstrumentsSelect;
