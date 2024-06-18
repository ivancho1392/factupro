"use client";

import { createContext, useState } from "react";

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const [confirmar, setConfirmar] = useState(false);
  const [modal, setModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [menuAccount, setMenuAccount] = useState(false);
  const [role, setRole] = useState(null);
  const [invoiceDataByMonth, setInvoiceDataByMonth] = useState({});
  const [currentMonth, setCurrentMonth] = useState("");

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

  const toggleAccountMenu = () => {
    setMenuAccount(!menuAccount);
  };

  const closeAccountMenu = () => {
    setMenuAccount(false);
  };

  const updateInvoiceDataByMonth = (month, data) => {
    setInvoiceDataByMonth((prevState) => ({
      ...prevState,
      [month]: data,
    }));
  };

  return (
    <AppContext.Provider
      value={{
        menuAccount,
        toggleAccountMenu,
        closeAccountMenu,
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
        role,
        setRole,
        invoiceDataByMonth,
        updateInvoiceDataByMonth,
        currentMonth,
        setCurrentMonth,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
