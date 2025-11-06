import React, { useContext } from "react";
import { FaChevronDown } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import MenuVisibilityContext from "../../context/menuVisibilityContext";
import styles from "../../styles/sidebar.module.css";

// Define los tipos de los props
interface SidebarProps {
  activeComponent: "upload" | "consult" | "uploadIA" | "calculator" | null;
  setActiveComponent: (
    component: "upload" | "consult" | "uploadIA" | "calculator" | null
  ) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeComponent, setActiveComponent }) => {
  const { menuVisible, toggleMenu } = useContext(MenuVisibilityContext);

  const handleOptionClick = (option: "upload" | "consult" | "uploadIA" | "calculator" | null) => {
    setActiveComponent(option);
    if (window.innerWidth <= 768) {
      toggleMenu(); 
    }
  };

  return (
    <aside className={`${styles.sidebar} ${menuVisible ? styles.visible : ""}`}>
      <button
        className={`${styles.buttonSide} ${activeComponent === "upload" ? styles.active : ""}`}
        onClick={() => handleOptionClick(activeComponent === "upload" ? null : "upload")}
      >
        Subir Facturas {activeComponent === "upload" ? <IoCloseSharp /> : <FaChevronDown />}
      </button>
      <button
        className={`${styles.buttonSide} ${activeComponent === "consult" ? styles.active : ""}`}
        onClick={() => handleOptionClick(activeComponent === "consult" ? null : "consult")}
      >
        Consultar Facturas {activeComponent === "consult" ? <IoCloseSharp /> : <FaChevronDown />}
      </button>
      <button
        className={`${styles.buttonSide} ${activeComponent === "uploadIA" ? styles.active : ""}`}
        onClick={() => handleOptionClick(activeComponent === "uploadIA" ? null : "uploadIA")}
      >
        Cargar con IA {activeComponent === "uploadIA" ? <IoCloseSharp /> : <FaChevronDown />}
      </button>
      <button
        className={`${styles.buttonSide} ${activeComponent === "calculator" ? styles.active : ""}`}
        onClick={() => handleOptionClick(activeComponent === "calculator" ? null : "calculator")}
      >
        Calculadora Cotizaciones {activeComponent === "calculator" ? <IoCloseSharp /> : <FaChevronDown />}
      </button>
    </aside>
  );
};

export default Sidebar;
