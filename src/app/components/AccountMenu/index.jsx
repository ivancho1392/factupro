"use client";

import React, { useContext } from "react";
import styles from "./styles.module.css";
import Link from "next/link";
import { GrWaypoint } from "react-icons/gr";
import { HiOutlineWrench, HiOutlinePhoto } from "react-icons/hi2";
import { AiOutlineTeam } from "react-icons/ai";
import { AppContext } from "../../context/index";
import { logout } from "@/app/services/authService";


const Menu = () => {
  const { menuAccount, closeAccountMenu} = useContext(AppContext);
  const context = useContext(AppContext);

  const handleLogout = async () => {
    await logout();
    context.setRole(null);
    window.location.reload();
    window.location.href = "/";
    closeAccountMenu();  
  };

  return (
    <>
      {menuAccount && <div className={styles.overlay} onClick={closeAccountMenu}></div>}
      <div className={menuAccount ? styles.menuopen : styles.menuclose}>
        {menuAccount && (
          <>
            <Link href="/verifySignUp" onClick={closeAccountMenu} className={styles.menuitem}>
              <div className={styles.icon}><HiOutlineWrench /></div>
              <div className={styles.name}>Confirmar cuenta</div>
            </Link>
            <div onClick={handleLogout} className={styles.menuitem}>
              <div className={styles.icon}><HiOutlinePhoto /></div>
              <div className={styles.name}>Cerrar sesión</div>
            </div>
            <Link href="#contact" onClick={closeAccountMenu} className={styles.menuitem}>
              <div className={styles.icon}><GrWaypoint /></div>
              <div className={styles.name}>Contacto</div>
            </Link>
            <div className={styles.divider}></div>
            <Link href="https://techverticalsa.com" onClick={closeAccountMenu} className={`${styles.menuitem} ${styles.techvertical}`}>
              <div className={styles.icon}><AiOutlineTeam /></div>
              <div className={styles.name}>Landing Page TECHVERTICAL</div>
            </Link>
          </>
        )}
      </div>
    </>
  );
};

export default Menu;
