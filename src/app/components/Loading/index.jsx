"use client";

import React, { useContext } from "react";
import { AppContext } from "../../context";

const LoadingModal = () => {
  const { loading } = useContext(AppContext);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-4 rounded shadow-md">
        <p>Cargando, espere por favor...</p>
      </div>
    </div>
  );
};

export default LoadingModal;