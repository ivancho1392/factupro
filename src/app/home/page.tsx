// src/app/home/page.tsx
"use client";
import React, { useState, useContext } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Header from "../components/Header/index";
import DetailArea from "../components/DetailArea/DetailArea";
import styles from "../styles/home.module.css";
import { AppContext } from "../context/index";
import { MenuVisibilityProvider } from "../context/menuVisibilityContext";

const Home: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<"consult" | "upload" | "uploadIA" | "calculator" | null>(null);
  const context = useContext(AppContext);

  return (
    <MenuVisibilityProvider> {/* Proveedor para visibilidad del menú */}
      <div className={styles.pageContainer}>
        <Header /> {/* Coloca el Header fuera de la estructura de Sidebar y DetailArea */}
        <div className={styles.mainContent}>
          <Sidebar activeComponent={activeComponent} setActiveComponent={setActiveComponent} />
          <DetailArea activeComponent={activeComponent} context={context} />
        </div>
      </div>
    </MenuVisibilityProvider>
  );
};

export default Home;
