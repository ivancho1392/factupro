"use client";

import React, { useContext } from "react";
import styles from "./styles.module.css";
import { AppContext } from "../context";

const ModalMenu = () => {
  const { modal, closeModal } = useContext(AppContext);

  return (
    <div className={modal ? styles.modalopen : styles.modalclose}>
      {modal && (
        <div className={styles.modalContent}>
          <h2 className="text-2xl font-bold">Confirmación</h2>
          <p className="mt-4">
            ¿Estas seguro de que quieres eliminar esta factura?
          </p>
          <button
            onClick={closeModal}
            className="mt-4 p-2 bg-custom-red mr-8 text-white rounded hover:bg-gray-700 transition duration-300"
          >
            Eliminar
          </button>
          <button
            onClick={closeModal}
            className="mt-4 p-2 bg-gray-500 text-white rounded hover:bg-gray-700 transition duration-300"
          >
            Volver
          </button>
        </div>
      )}
    </div>
  );
};

export default ModalMenu;