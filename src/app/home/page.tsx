"use client";

import React, { useState, useContext } from 'react';
import InvoiceConsult from '../components/invoiceConsult';
import InvoiceUpload from '../components/invoiceUpload';
import { Montserrat } from 'next/font/google';
import styles from '../styles/topbar.module.css';
import { AppContext } from '../context/index';

const montserrat = Montserrat({ subsets: ['latin'] });
const Home: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<'consult' | 'upload'>('consult');

  const context = useContext(AppContext);
  return (
    <div className={montserrat.className}>
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
      <div className="w-full flex flex-col lg:flex-row gap-4 mb-[60px]">
        <div className="w-full lg:w-[70%]">
          {activeComponent === 'consult' && context.role === 'Admin'  && <InvoiceConsult />}
          {activeComponent === 'upload' && context.role === 'Admin' && <InvoiceUpload />}
          {activeComponent === 'consult' && context.role === 'Externo' && <InvoiceConsult />}
          {activeComponent === 'upload' && context.role === 'Externo' && <>
          <p>Función no permitida para este Role.</p></>}
        </div>
        <div className="w-full lg:w-[30%]">
          <h1>Segunda área de detalle</h1>
        </div>
      </div>
    </div>
  );
};

export default Home;