
"use client";

import React, { useContext } from "react";
import styles from "./styles.module.css";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GrWaypoint } from "react-icons/gr";
import { HiOutlineWrench, HiOutlinePhoto } from "react-icons/hi2";
import { AiOutlineTeam } from "react-icons/ai";
import { AppContext } from "../../context/index";
import { logout } from "@/app/services/authService";

const Menu = () => {
  const router = useRouter();
  const context = useContext(AppContext);
  const { menuAccount, closeAccountMenu } = context;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      // Si Cognito responde "No current user", igual limpiamos estado local.
      console.warn("Logout warning:", error);
    } finally {
      context.setRole(null);

      localStorage.removeItem("idToken");
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");

      closeAccountMenu();
      router.replace("/");
    }
  };

  return (
    <>
      {menuAccount && (
        <div className={styles.overlay} onClick={closeAccountMenu}></div>
      )}

      <div className={menuAccount ? styles.menuopen : styles.menuclose}>
        {menuAccount && (
          <>
            <div onClick={handleLogout} className={styles.menuitem}>
              <div className={styles.icon}>
                <HiOutlinePhoto />
              </div>
              <div className={styles.name}>Cerrar sesión</div>
            </div>

            <Link
              href="#contact"
              onClick={closeAccountMenu}
              className={styles.menuitem}
            >
              <div className={styles.icon}>
                <GrWaypoint />
              </div>
              <div className={styles.name}>Contacto</div>
            </Link>

            <Link
              href="/verifySignUp"
              onClick={closeAccountMenu}
              className={styles.menuitem}
            >
              <div className={styles.icon}>
                <HiOutlineWrench />
              </div>
              <div className={styles.name}>Confirmar cuenta</div>
            </Link>

            <div className={styles.divider}></div>

            <Link
              href="https://techverticalsa.com"
              onClick={closeAccountMenu}
              className={`${styles.menuitem} ${styles.techvertical}`}
            >
              <div className={styles.icon}>
                <AiOutlineTeam />
              </div>
              <div className={styles.name}>Landing Page TECHVERTICAL</div>
            </Link>
          </>
        )}
      </div>
    </>
  );
};

export default Menu;