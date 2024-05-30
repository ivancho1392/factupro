"use client";

import React, { useState } from 'react';
import styles from '../styles/AuthForm.module.css';

export interface VerifyFormProps {
  onSubmit: (email: string, verificationCode: string) => void;
}

const AuthForm: React.FC<VerifyFormProps> = ({ onSubmit }) => {
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    onSubmit(email, verificationCode);
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <div className={styles['form-title']}>
        <h2>{'Verificar Correo Electrónico'}</h2>
      </div>
      <div>
        <label>Correo Electrónico</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
     
      <div>
        <label>Codigo de verificación</label>
        <input
          type="string"
          value={verificationCode}
          onChange={(e) => setVerificationCode(e.target.value)}
        />
      </div>
     

      <button type="submit">{'Verificar'}</button>
    </form>
  );
};

export default AuthForm;
