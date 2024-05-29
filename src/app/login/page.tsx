"use client";

import React from 'react';
import AuthForm from '../components/AuthForm';
import { login } from '../services/authService';

const LoginPage: React.FC = () => {
  const handleLogin = (email: string, password: string) => {
    login(email, password)
      .then((response) => {
        console.log('Login successful:', response);
      })
      .catch((error) => {
        console.error('Login failed:', error);
      });
  };

  return (
    <div>
      <h1>Login Page</h1>
      <AuthForm mode="login" onSubmit={handleLogin} />
    </div>
  );
};

export default LoginPage;