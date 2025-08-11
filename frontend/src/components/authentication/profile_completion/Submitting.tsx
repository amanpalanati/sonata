import React from "react";

import { useBodyClass } from "../../../hooks/useBodyClass";
import styles from "../../../styles/authentication/ProfileCompletion.module.css";

const Submitting: React.FC = () => {
  useBodyClass("auth");

  return (
    <div className={styles.container}>
      <h1 className={styles.h1}>Completing Profile...</h1>
      <p className={styles.p}>Please wait while we set up your account.</p>
    </div>
  );
};

export default Submitting;
