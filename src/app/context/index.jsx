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
  const [currentPeriod, setCurrentPeriod] = useState("");

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

  const updateInvoiceDataByMonth = (periodKey, data) => {
    setInvoiceDataByMonth((prevState) => ({
      ...prevState,
      [periodKey]: data,
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
        currentPeriod,
        setCurrentPeriod,
        // Legacy aliases for backward compatibility
        currentMonth: currentPeriod,
        setCurrentMonth: setCurrentPeriod,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
