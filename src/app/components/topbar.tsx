import React from "react";
import styles from "../styles/topbar.module.css";

interface TopBarProps {
  setActiveComponent: (component: "consult" | "upload") => void;
}

const TopBar: React.FC<TopBarProps> = ({ setActiveComponent }) => {
  return (
    <div className={styles.topbar}>
      <button
        className={styles.button}
        onClick={() => setActiveComponent("consult")}
      >
        Consultar Facturas
      </button>
      <button
        className={styles.button}
        onClick={() => setActiveComponent("upload")}
      >
        Subir Facturas
      </button>
    </div>
  );
};

export default TopBar;
