import React from "react";

import { useTitle } from "../../hooks/useTitle";

const About: React.FC = () => {
  useTitle("About");

  return <h1>About</h1>;
};

export default About;
