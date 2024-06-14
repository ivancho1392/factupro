"use client";

import Image from "next/image";
import { useEffect, useState, useContext } from "react";
import { useRouter } from "next/navigation";
import { getDecodedIdToken, getUserRoles } from "@/app/services/authService";
import styles from "./styles.module.css";
import { AiOutlineUser, AiOutlineCloseSquare } from "react-icons/ai";
import { AppContext } from "@/app/context";

const Header = () => {
  const [userEmail, setUserEmail] = useState("");
  const [userRoles, setUserRoles] = useState([]);
  const router = useRouter();
  const context = useContext(AppContext);

  useEffect(() => {
    getDecodedIdToken().then((decodedToken) => {
      setUserEmail(decodedToken.email);
    });
  }, [context.isAuthenticated]);

  useEffect(() => {
    getUserRoles().then((roles) => {
      setUserRoles(roles);
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
        <h1 className={styles.header_title}>FactuPro - Gestiona tu factura</h1>
        {context.menuAccount ? (
          <AiOutlineCloseSquare
            size={30}
            onClick={toggleAccountMenu}
            className="cursor-pointer"
          />
        ) : (
          <>
            <div
              className={styles.header_user_info}
              onClick={toggleAccountMenu}
            >
              <div>{userEmail ? `${userEmail}` : "Usuario no autenticado"}</div>
              <div>
                {userRoles.length > 0
                  ? `${userRoles.join(", ")}`
                  : "Cargando role..."}
              </div>
            </div>
            <AiOutlineUser
              className={styles.header_icon}
              onClick={toggleAccountMenu}
            />
          </>
        )}
      </div>
    </header>
  );
};

export default Header;
