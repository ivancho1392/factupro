"use client";

import React from 'react';
import VerifyForm from '../components/VerifyForm';
import { confirmSignUp } from '../services/authService';
import styles from '../styles/page.module.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const VerifyPage: React.FC = () => {
  const handleVerification = (email: string, verificationCode: string) => {
    console.log('Verifying:', email, verificationCode);
    console.log('code:', verificationCode);
    confirmSignUp(email, verificationCode)
      .then(() => {
        toast.success('Verificación exitosa. Ingresa con tu correo electrónico y contraseña.');
        setTimeout(() => {
        window.location.href = '/';
      }, 3000);
      })
      .catch((error) => {
        toast.error('Verificación fallida. Por favor, intenta de nuevo o comunicate con un administrador.');
      });
  };

  return (
    <div className={styles.container}>
      <h1>Se ha enviado un email de verificación a tu correo electrónico, ingresa el código recibido para confirmar tu cuenta.</h1>
      <VerifyForm onSubmit={handleVerification} />
      <ToastContainer />
    </div>
  );
};

export default VerifyPage;