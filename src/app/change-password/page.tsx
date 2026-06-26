"use client";

import React, { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  changePassword,
  getDecodedIdToken,
  logout,
  validatePasswordPolicy,
} from "../services/authService";
import styles from "./changePassword.module.css";

const ChangePasswordPage: React.FC = () => {
  const router = useRouter();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    const validateSession = async () => {
      try {
        await getDecodedIdToken();
        setIsCheckingAuth(false);
      } catch {
        router.replace("/");
      }
    };

    validateSession();
  }, [router]);

  const validateForm = () => {
    const validationErrors: string[] = [];

    if (!currentPassword.trim()) {
      validationErrors.push("Ingresa tu contraseña actual.");
    }

    if (!newPassword.trim()) {
      validationErrors.push("Ingresa una nueva contraseña.");
    }

    if (!confirmPassword.trim()) {
      validationErrors.push("Confirma tu nueva contraseña.");
    }

    if (newPassword) {
      validationErrors.push(...validatePasswordPolicy(newPassword).errors);
    }

    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      validationErrors.push("La nueva contraseña y la confirmación no coinciden.");
    }

    if (currentPassword && newPassword && currentPassword === newPassword) {
      validationErrors.push("La nueva contraseña debe ser diferente a la contraseña actual.");
    }

    setErrors(validationErrors);
    return validationErrors.length === 0;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await changePassword(currentPassword, newPassword);
      toast.success("Contraseña actualizada. Vuelve a iniciar sesión.");

      setTimeout(async () => {
        await logout();
        router.replace("/");
      }, 1500);
    } catch {
      toast.error("No se pudo cambiar la contraseña. Verifica los datos e intenta nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCheckingAuth) {
    return (
      <main className={styles.container}>
        <section className={styles.card}>
          <p className={styles.status}>Validando sesión...</p>
        </section>
      </main>
    );
  }

  return (
    <main className={styles.container}>
      <section className={styles.card}>
        <div className={styles.header}>
          <h1>Cambiar contraseña</h1>
          <p>Actualiza tu acceso de forma segura.</p>
        </div>

        {errors.length > 0 && (
          <div className={styles.errorBox} role="alert">
            {errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="currentPassword">Contraseña actual</label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
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
              {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
            </button>
            <button type="button" className={styles.secondaryButton} onClick={() => router.back()}>
              Cancelar
            </button>
          </div>
        </form>
      </section>
      <ToastContainer />
    </main>
  );
};

export default ChangePasswordPage;
