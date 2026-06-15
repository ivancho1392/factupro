
// src/app/home/page.tsx
"use client";

import React, { useState, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/Header/index";
import DetailArea from "../components/DetailArea/DetailArea";
import styles from "../styles/home.module.css";
import { AppContext } from "../context/index";
import { MenuVisibilityProvider } from "../context/menuVisibilityContext";
import { getDecodedIdToken } from "../services/authService";

const Home: React.FC = () => {
  const router = useRouter();
  const context = useContext(AppContext);

  const [activeComponent, setActiveComponent] = useState<
    "consult" | "upload" | "uploadIA" | "calculator" | null
  >(null);

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const validateSession = async () => {
      try {
        const decodedToken = await getDecodedIdToken();

        if (!decodedToken) {
          context.setRole(null);
          router.replace("/");
          return;
        }

        setIsAuthenticated(true);
      } catch (error) {
        console.warn("No authenticated user:", error);
        context.setRole(null);
        setIsAuthenticated(false);
        router.replace("/");
      } finally {
        setIsCheckingAuth(false);
      }
    };

    validateSession();
  }, [router, context]);

  if (isCheckingAuth) {
    return (
      <div className={styles.pageContainer}>
        <Header />
        <div className={styles.mainContent}>
          <p style={{ padding: "24px" }}>Validando sesión...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <MenuVisibilityProvider>
      <div className={styles.pageContainer}>
        <Header />
        <div className={styles.mainContent}>
          <Sidebar
            activeComponent={activeComponent}
            setActiveComponent={setActiveComponent}
          />
          <DetailArea activeComponent={activeComponent} context={context} />
        </div>
      </div>
    </MenuVisibilityProvider>
  );
};

export default Home;