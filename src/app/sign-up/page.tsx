"use client";

import React from 'react';
import AuthForm from '../components/AuthForm';
import { signUp } from '../services/authService';
import styles from '../styles/page.module.css';
import Link from 'next/link';

const SignUpPage: React.FC = () => {
  const handleSignUp = (email: string, password: string) => {
    signUp(email, password)
      .then((response) => {
        console.log('Sign Up successful:', response);
      })
      .catch((error) => {
        console.error('Sign Up failed:', error);
      });
  };

  return (
    <div className={styles.container}>
          <h1>Ingresa los datos para tu nueva cuenta</h1>
      <AuthForm mode="sign-up" onSubmit={handleSignUp} />
      <p>¿Ya tenes una cuenta? <Link href="/">Inicia sesión</Link></p>
    </div>
  );
};

export default SignUpPage;