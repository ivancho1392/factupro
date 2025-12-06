"use client";

import Image from "next/image";
import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { getDecodedIdToken, getUserRoles } from "@/app/services/authService";
import styles from "./styles.module.css";
import { AiOutlineUser, AiOutlineCloseSquare, AiOutlineMenu } from "react-icons/ai";
import { AppContext } from "@/app/context";
import MenuVisibilityContext from "@/app/context/menuVisibilityContext";

const Header = () => {
  const [userEmail, setUserEmail] = useState("");
  const [userRoles, setUserRoles] = useState([]);
  const router = useRouter();
  const context = useContext(AppContext);
  const { toggleMenu } = useContext(MenuVisibilityContext);

  useEffect(() => {
    getDecodedIdToken().then((decodedToken) => {
      setUserEmail(decodedToken.email);
    });
  }, [context.isAuthenticated]);

  useEffect(() => {
    getUserRoles().then((roles) => {
      setUserRoles(roles);
      context.setRole(roles[0]);
    });
  }, []);

  const toggleAccountMenu = () => {
    context.toggleAccountMenu();
  };

  const handleLogoClick = () => {
    if (userEmail) {
      router.push("/home");
    } else {
      router.push("/");
    }
    context.closeAccountMenu();
  };

  return (
    <header className={styles.header}>
      <div className={styles.header_top} onClick={handleLogoClick}>
        <Image src="/logo.png" alt="Company Logo" width={180} height={50} />
      </div>
      <div className={styles.header_bottom}>
        {/* Botón de menú, solo visible en mobile */}
        <AiOutlineMenu size={30} onClick={toggleMenu} className={styles.menuButton} />
        <h1 className={styles.header_title}>FactuPro - Gestiona tus Facturas, Cotizaciones y Presupuestos</h1>
        <div className={styles.header_user_section}>
          {context.menuAccount ? (
            <AiOutlineCloseSquare size={30} onClick={toggleAccountMenu} className="cursor-pointer" />
          ) : (
            <div className={styles.header_user_info} onClick={toggleAccountMenu}>
              <div>{userEmail || "Usuario no autenticado"}</div>
              <div>{userRoles.length > 0 ? userRoles.join(", ") : "Cargando role..."}</div>
            </div>
          )}
          <AiOutlineUser size={30} className={styles.header_icon} onClick={toggleAccountMenu} />
        </div>
      </div>
    </header>
  );
};

export default Header;
