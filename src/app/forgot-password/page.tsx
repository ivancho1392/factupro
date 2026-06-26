"use client";

import React, { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  confirmForgotPassword,
  forgotPassword,
  validatePasswordPolicy,
} from "../services/authService";
import styles from "./forgotPassword.module.css";

const ForgotPasswordPage: React.FC = () => {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const normalizedEmail = email.trim();

  const handleRequestCode = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();

    if (!normalizedEmail) {
      setErrors(["Ingresa tu correo electrónico."]);
      return;
    }

    setErrors([]);
    setIsSubmitting(true);

    try {
      await forgotPassword(normalizedEmail);
      toast.success("Enviamos un código de recuperación a tu correo.");
      setStep(2);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "No pudimos enviar el código de recuperación. Intenta nuevamente."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (!normalizedEmail) {
      setErrors(["Ingresa tu correo electrónico."]);
      setStep(1);
      return;
    }

    setErrors([]);
    setIsResending(true);

    try {
      await forgotPassword(normalizedEmail);
      toast.success("Solicitamos un nuevo código para tu correo.");
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "No pudimos enviar un nuevo código. Intenta nuevamente."]);
    } finally {
      setIsResending(false);
    }
  };

  const validateConfirmForm = () => {
    const validationErrors: string[] = [];

    if (!code.trim()) {
      validationErrors.push("Ingresa el código de verificación.");
    }

    if (!newPassword) {
      validationErrors.push("Ingresa una nueva contraseña.");
    } else {
      validationErrors.push(...validatePasswordPolicy(newPassword).errors);
    }

    if (!confirmPassword) {
      validationErrors.push("Confirma tu nueva contraseña.");
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      validationErrors.push("La nueva contraseña y la confirmación no coinciden.");
    }

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleConfirmPassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateConfirmForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await confirmForgotPassword(normalizedEmail, code, newPassword);
      toast.success("Contraseña actualizada correctamente. Ya puedes iniciar sesión.");

      setTimeout(() => {
        router.replace("/");
      }, 1500);
    } catch (error) {
      setErrors([error instanceof Error ? error.message : "No pudimos cambiar la contraseña. Intenta nuevamente."]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className={styles.container}>
      <section className={styles.card}>
        <div className={styles.header}>
          <h1>Recuperar contraseña</h1>
          <p>Solicita un código y define una nueva contraseña.</p>
        </div>

        {errors.length > 0 && (
          <div className={styles.errorBox} role="alert">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestCode} className={styles.form}>
            <div className={styles.field}>
              <label htmlFor="email">Correo electrónico</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
              />
            </div>

            <div className={styles.actions}>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enviando..." : "Enviar código"}
              </button>
            </div>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleConfirmPassword} className={styles.form}>
            <p className={styles.info}>
              Ingresa el código enviado a <strong>{normalizedEmail}</strong>.
            </p>

            <div className={styles.field}>
              <label htmlFor="code">Código de verificación</label>
              <input
                id="code"
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                autoComplete="one-time-code"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="newPassword">Nueva contraseña</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="confirmPassword">Confirmar nueva contraseña</label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
              />
            </div>

            <div className={styles.actions}>
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Actualizando..." : "Cambiar contraseña"}
              </button>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={handleResendCode}
                disabled={isResending}
              >
                {isResending ? "Solicitando..." : "Solicitar nuevo código"}
              </button>
            </div>
          </form>
        )}

        <Link href="/" className={styles.backLink}>
          Volver al inicio de sesión
        </Link>
      </section>
      <ToastContainer />
    </main>
  );
};

export default ForgotPasswordPage;
