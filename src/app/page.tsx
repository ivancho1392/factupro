"use client";

import React from 'react';
import Link from 'next/link';
import styles from './styles/page.module.css';
import AuthForm from './components/AuthForm';
import { login } from './services/authService';

const HomePage: React.FC = () => {

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
    <div className={styles.container}>
          <h1>Bienvenido</h1>
          <h1>¡Nos alegra verte aquí!, Ingresa tus credenciales para continuar</h1>
          <AuthForm mode="login" onSubmit={handleLogin} />
          <p>¿Nuevo aquí? <Link href="/sign-up">Regístrate ahora</Link></p>
    </div>
  );
};

export default HomePage;