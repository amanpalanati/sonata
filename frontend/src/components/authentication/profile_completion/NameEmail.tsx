import React, { useState } from "react";
import { StepComponentProps } from "../../../types/profileCompletion";

// Extract just the properties this component needs
interface NameEmailData {
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface NameEmailProps extends Pick<StepComponentProps, "onNext" | "onPrev"> {
  data: NameEmailData;
  onUpdate: (data: Partial<NameEmailData>) => void;
}

const NameEmail: React.FC<NameEmailProps> = ({
  data,
  onUpdate,
  onNext,
  onPrev,
}) => {
  const [firstName, setFirstName] = useState(data.firstName || "");
  const [lastName, setLastName] = useState(data.lastName || "");
  const [email, setEmail] = useState(data.email || "");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const validateAndProceed = () => {
    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = "First name is required";
    }
    if (!lastName.trim()) {
      newErrors.lastName = "Last name is required";
    }
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      // Update parent state with current values
      onUpdate({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
      });
      onNext();
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "2rem" }}>
      <h2>Complete Your Profile</h2>
      <p>Please provide your name and verify your email address.</p>

      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="firstName"
          style={{ display: "block", marginBottom: "0.5rem" }}
        >
          First Name *
        </label>
        <input
          id="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: errors.firstName ? "2px solid red" : "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        {errors.firstName && (
          <span style={{ color: "red", fontSize: "0.875rem" }}>
            {errors.firstName}
          </span>
        )}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <label
          htmlFor="lastName"
          style={{ display: "block", marginBottom: "0.5rem" }}
        >
          Last Name *
        </label>
        <input
          id="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: errors.lastName ? "2px solid red" : "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        {errors.lastName && (
          <span style={{ color: "red", fontSize: "0.875rem" }}>
            {errors.lastName}
          </span>
        )}
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <label
          htmlFor="email"
          style={{ display: "block", marginBottom: "0.5rem" }}
        >
          Email Address *
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            border: errors.email ? "2px solid red" : "1px solid #ccc",
            borderRadius: "4px",
          }}
        />
        {errors.email && (
          <span style={{ color: "red", fontSize: "0.875rem" }}>
            {errors.email}
          </span>
        )}
      </div>

      <div
        style={{
          display: "flex",
          gap: "1rem",
          justifyContent: "space-between",
        }}
      >
        {onPrev && (
          <button
            onClick={onPrev}
            style={{
              padding: "0.75rem 1.5rem",
              border: "1px solid #ccc",
              borderRadius: "4px",
              background: "white",
              cursor: "pointer",
            }}
          >
            Back
          </button>
        )}
        <button
          onClick={validateAndProceed}
          style={{
            padding: "0.75rem 1.5rem",
            border: "none",
            borderRadius: "4px",
            background: "black",
            color: "white",
            cursor: "pointer",
            marginLeft: onPrev ? "0" : "auto",
          }}
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default NameEmail;
