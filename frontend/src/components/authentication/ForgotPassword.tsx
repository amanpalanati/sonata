import React, { useState } from "react";
import { AnimatePresence, motion } from "motion/react";

import { ForgotPasswordEmailData } from "../../types";
import { authService } from "../../services/auth";

import Header from "./Header";
import ForgotPasswordEmailForm from "../forms/ForgotPasswordEmailForm";
import ForgotPasswordEmailSent from "./ForgotPasswordEmailSent";

import styles from "../../styles/forms/ForgotPassword.module.css";

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<"email" | "sent">("email");
  const [email, setEmail] = useState<string>("");

  const handleEmailSubmit = async (
    data: ForgotPasswordEmailData
  ): Promise<void> => {
    try {
      const result = await authService.forgotPassword(data);

      if (result.success) {
        setEmail(data.email);
        setStep("sent");
      }
    } catch (error) {
      // Error will be handled by the form component
      throw error;
    }
  };

  // Animation variants for sliding left
  const slideVariants = {
    initial: {
      opacity: 0,
      x: 50,
    },
    animate: {
      opacity: 1,
      x: 0,
    },
    exit: {
      opacity: 0,
      x: -50,
    },
  };

  return (
    <>
      <Header />
      <main>
        <div className={styles.outer}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              className={styles.step}
              variants={slideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{
                duration: 0.25,
                ease: [0.25, 0.46, 0.45, 0.94],
                opacity: { duration: 0.2 },
                x: { duration: 0.25 },
              }}
            >
              {step === "email" ? (
                <ForgotPasswordEmailForm onSubmit={handleEmailSubmit} />
              ) : (
                <ForgotPasswordEmailSent email={email} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </>
  );
};

export default ForgotPassword;
