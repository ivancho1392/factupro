"use client";

import React, { useState } from 'react';
import Topbar from '../components/topbar';
import InvoiceConsult from '../components/invoiceConsult';
import InvoiceUpload from '../components/invoiceUpload';
import styles from '../styles/home.module.css';
const Home: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<'consult' | 'upload'>('consult');

  return (
    <div>
      <Topbar setActiveComponent={setActiveComponent} />
      <div className={styles.mainContainer}>
        <div className={styles.detailContainer}>
          {activeComponent === 'consult' && <InvoiceConsult />}
          {activeComponent === 'upload' && <InvoiceUpload />}
        </div>
        <div className={styles.seconAreaContainer}>
          <h1>Segunda área de detalle</h1>
        </div>
      </div>
    </div>
  );
};

export default Home;