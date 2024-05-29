"use client";

import React, { useState } from 'react';
import styles from '../styles/AuthForm.module.css';

export interface AuthFormProps {
  mode: 'login' | 'sign-up';
  onSubmit: (email: string, password: string, name?: string, confirmPassword?: string, confirmEmail?: string) => void;
}

const AuthForm: React.FC<AuthFormProps> = ({ mode, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    // Validaciones
    if (mode === 'sign-up') {
      if (name.length < 5 || name.length > 40) {
        setError('El nombre debe tener entre 5 y 40 caracteres');
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError('Por favor, ingresa un correo electrónico válido');
        return;
      }
      if (password.length < 5 || password.length > 20 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        setError('La contraseña debe tener entre 5 y 20 caracteres y contener al menos una letra mayúscula, una letra minúscula y un número');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden');
        return;
      }
      if (email !== confirmEmail) {
        setError('Los correos electrónicos no coinciden');
        return;
      }
    }

    // Si todas las validaciones pasan, envía los datos
    onSubmit(email, password, mode === 'sign-up' ? name : undefined, mode === 'sign-up' ? confirmPassword : undefined, mode === 'sign-up' ? confirmEmail : undefined);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles['form-title']}>
        <h2>{mode === 'login' ? 'Inicio de Sesión' : 'Registrar nueva cuenta'}</h2>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      {mode === 'sign-up' && (
        <>
        <div>
            <label>Nombre</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        </>
      )}
      <div>
        <label>Correo Electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      {mode === 'sign-up' && (
        <>
         <div>
            <label>Confirmar Correo Electrónico</label>
            <input
              type="email"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
            />
          </div>
        </>
      )}
      <div>
        <label>Contraseña</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {mode === 'sign-up' && (
        <>
          
          <div>
            <label>Confirmar Contraseña</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </>
      )}
      <button type="submit">{mode === 'login' ? 'Iniciar Sesión' : 'Registrarse'}</button>
    </form>
  );
};

export default AuthForm;
