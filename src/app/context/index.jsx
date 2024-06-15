"use client";

import { createContext, useState } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [confirmar, setConfirmar] = useState(false);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const openModal = () => {
    setModal(true);
  };
  const closeModal = () => {
    setModal(false);
  };

  const openLoading = () => {
    setLoading(true);
  };
  const closeLoading = () => {
    setLoading(false);
  };
  const openConfirmar = () => {
    setConfirmar(true);
  };
  const closeConfirmar = () => {
    setConfirmar(false);
  };
  return (
    <AppContext.Provider
      value={{
        loading,
        setLoading,
        openLoading,
        closeLoading,
        confirmar,
        modal,
        openModal,
        closeModal,
        openConfirmar,
        closeConfirmar,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
