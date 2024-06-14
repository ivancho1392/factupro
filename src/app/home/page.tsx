"use client";

import React, { useState } from 'react';
import Topbar from '../components/topbar';
import InvoiceConsult from '../components/invoiceConsult';
import InvoiceUpload from '../components/invoiceUpload';
import { Montserrat } from 'next/font/google';

const montserrat = Montserrat({ subsets: ['latin'] });
const Home: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<'consult' | 'upload'>('consult');

  return (
    <div className={montserrat.className}>
      <Topbar setActiveComponent={setActiveComponent} />
      <div className="w-full flex flex-col lg:flex-row gap-4 mb-[60px]">
        <div className="w-full lg:w-[70%]">
          {activeComponent === 'consult' && <InvoiceConsult />}
          {activeComponent === 'upload' && <InvoiceUpload />}
        </div>
        <div className="w-full lg:w-[30%]">
          <h1>Segunda área de detalle</h1>
        </div>
      </div>
    </div>
  );
};

export default Home;