import React from 'react';
import { useParams } from 'react-router-dom';

const SignUp: React.FC = () => {
  const { accountType } = useParams<{ accountType: string }>();
  
  return (
    <h1>Create {accountType} Account</h1>
  );
};

export default SignUp;