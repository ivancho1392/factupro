"use client";

import React, { useState, useContext } from "react";
import InvoiceConsult from "../components/invoiceConsult";
import InvoiceUpload from "../components/invoiceUpload";
import { Montserrat } from "next/font/google";
import styles from "../styles/topbar.module.css";
import { AppContext } from "../context/index";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { chartColors } from "./colors";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

ChartJS.register(ArcElement, Tooltip, Legend);

const montserrat = Montserrat({ subsets: ["latin"] });

const monthNames = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

const getMonthName = (monthNumber: string) => {
  const index = parseInt(monthNumber, 10) - 1;
  return monthNames[index] || "";
};

const Home: React.FC = () => {
  const [activeComponent, setActiveComponent] = useState<
    "consult" | "upload" | null
  >(null);

  const context = useContext(AppContext);

  const { invoiceDataByMonth } = context;

  const currentMonthData = invoiceDataByMonth[context.currentMonth] || {};

  const data = {
    labels: Object.keys(currentMonthData),
    datasets: [
      {
        label: "$USD",
        data: Object.values(currentMonthData),
        backgroundColor: chartColors,
        hoverBackgroundColor: chartColors,
        borderWidth: 0,
      },
    ],
  };

  const isEmptyData = Object.keys(currentMonthData).length === 0;

  return (
    <div className={montserrat.className}>
      <div className={styles.topbar}>
        <div
          className={`${styles.buttonContainer} ${
            activeComponent === "upload" ? styles.buttonContainerActive : ""
          }`}
        >
          <button
            className={`${styles.button} ${
              activeComponent === "upload" ? styles.active : ""
            }`}
            onClick={() =>
              setActiveComponent(activeComponent === "upload" ? null : "upload")
            }
          >
            Subir Facturas{" "}
            {activeComponent === "upload" ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
        <div
          className={`${styles.buttonContainer} ${
            activeComponent === "consult" ? styles.buttonContainerActive : ""
          }`}
        >
          <button
            className={`${styles.button} ${
              activeComponent === "consult" ? styles.active : ""
            }`}
            onClick={() =>
              setActiveComponent(
                activeComponent === "consult" ? null : "consult"
              )
            }
          >
            Consultar Facturas{" "}
            {activeComponent === "consult" ? (
              <FaChevronUp />
            ) : (
              <FaChevronDown />
            )}
          </button>
        </div>
      </div>
      <div className="w-full flex flex-col gap-4 mb-[60px]">
        <div className="w-full ">
          {activeComponent === "consult" && context.role === "Admin" && (
            <InvoiceConsult />
          )}
          {activeComponent === "upload" && context.role === "Admin" && (
            <InvoiceUpload />
          )}
          {activeComponent === "consult" && context.role === "Externo" && (
            <InvoiceConsult />
          )}
          {activeComponent === "upload" && context.role === "Externo" && (
            <>
              <p>Función no permitida para este Role.</p>
            </>
          )}
          {activeComponent === "upload" && !context.role && (
            <>
              <p>
                Usuario sin Role, comuniquese con el administrador por favor.
              </p>
            </>
          )}
          {activeComponent === "consult" && !context.role && (
            <>
              <p>
                Usuario sin Role, comuniquese con el administrador por favor.
              </p>
            </>
          )}
        </div>
        <div className="w-full max-w-[600px]">
          <h2 className="text-2xl mb-4 text-center">
            Facturas por categoria {getMonthName(context.currentMonth)} de 2024
          </h2>
          {isEmptyData ? (
            <p className="text-center">
              No tienes facturas registradas para el mes seleccionado
            </p>
          ) : (
            <Pie data={data} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
