"use client";

import React, { useContext } from 'react';
import Link from 'next/link';
import styles from './styles/page.module.css';
import AuthForm from './components/AuthForm';
import { login } from './services/authService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AppContext } from './context';

const HomePage: React.FC = () => {
  const context = useContext(AppContext);
  const handleLogin = (email: string, password: string) => {
    context.openLoading();
    login(email, password)
      .then((response) => {
        const { idToken, accessToken, refreshToken } = response;
        
        // Almacenar los tokens en localStorage
        localStorage.setItem('idToken', idToken);
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        
        toast.success('Acceso exitoso.');
        context.closeLoading();
        setTimeout(() => {
          window.location.href = '/home';
        }, 1500);
      })
      .catch((error) => {
        toast.error('Acceso fallido. Por favor, intenta de nuevo.');
      });
  };

  return (
    <div className={styles.container}>
          <h1>Bienvenido</h1>
          <h1>¡Nos alegra verte aquí!, Ingresa tus credenciales para continuar</h1>
          <AuthForm mode="login" onSubmit={handleLogin} />
          <p>¿Nuevo aquí? <Link href="/sign-up">Regístrate ahora</Link></p>
          <ToastContainer />
    </div>
  );
};

export default HomePage;