import React, { useContext } from "react";
import { FaChevronDown } from "react-icons/fa";
import { IoCloseSharp } from "react-icons/io5";
import MenuVisibilityContext  from "../../context/menuVisibilityContext";
import styles from "../../styles/sidebar.module.css";

const Sidebar = ({ activeComponent, setActiveComponent }) => {
  const { menuVisible, toggleMenu } = useContext(MenuVisibilityContext);

  const handleOptionClick = (option) => {
    setActiveComponent(option);
    if (window.innerWidth <= 768) {
      toggleMenu(); // Cierra el menú en mobile después de seleccionar una opción
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
    </aside>
  );
};

export default Sidebar;
