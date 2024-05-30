"use client";

import React from 'react';
import AuthForm from '../components/AuthForm';
import { signUp } from '../services/authService';
import styles from '../styles/page.module.css';
import Link from 'next/link';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const SignUpPage: React.FC = () => {

  if (typeof window === 'undefined') return null;
    const handleSignUp = (email: string, password: string, name?: string) => {
      signUp(email, password, name)
        .then(() => {
          toast.success('Registro exitoso. Revisa tu correo para verificar tu cuenta.');
        setTimeout(() => {
          window.location.href = '/verifySignUp';
        }, 3000);
        })
        .catch((error) => {
          toast.error('Registro fallido. Por favor, intenta de nuevo.');
        });
    };
  
  return (
    <div className={styles.container}>
          <h1>Ingresa los datos para tu nueva cuenta</h1>
      <AuthForm mode="sign-up" onSubmit={handleSignUp} />
      <p>¿Ya tienes una cuenta? <Link href="/">Inicia sesión</Link></p>
      <ToastContainer />
    </div>
  );
};

export default SignUpPage;