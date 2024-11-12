import React from "react";
import InvoiceConsult from "../invoiceConsult";
import InvoiceUpload from "../invoiceUpload";
import { Pie } from "react-chartjs-2";
import styles from "../../styles/detailArea.module.css";
import { chartColors } from "../../home/colors";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Define los posibles valores para `activeComponent`
type ActiveComponentType = "consult" | "upload" | null;

ChartJS.register(ArcElement, Tooltip, Legend);

// Define la estructura de los props que recibe `DetailArea`
interface DetailAreaProps {
  activeComponent: ActiveComponentType;
  context: {
    role: string;
    invoiceDataByMonth: Record<string, any>;
    currentMonth: string;
  };
}

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

const DetailArea: React.FC<DetailAreaProps> = ({ activeComponent, context }) => {
  const { invoiceDataByMonth, role, currentMonth } = context;
  const currentMonthData = invoiceDataByMonth[currentMonth] || {};

  const data = {
    labels: Object.keys(currentMonthData),
    datasets: [
      {
        label: "$USD",
        data: Object.values(currentMonthData),
        backgroundColor: chartColors,
      },
    ],
  };

  const isEmptyData = Object.keys(currentMonthData).length === 0;

  return (
    <main className={styles.detailArea}>
      {activeComponent === "consult" && role === "Admin" && <InvoiceConsult />}
      {activeComponent === "upload" && role === "Admin" && <InvoiceUpload />}
      {activeComponent === "consult" && role === "Externo" && <InvoiceConsult />}
      {activeComponent === "upload" && role === "Externo" && (
        <p>Función no permitida para este Role.</p>
      )}
      {!role && (
        <p>Usuario sin Role, comuníquese con el administrador por favor.</p>
      )}

      <h2 className="text-2xl mb-4 text-center">
        Facturas por categoría {getMonthName(currentMonth)} de 2024
      </h2>
      {isEmptyData ? (
        <p>No tienes facturas registradas para el mes seleccionado</p>
      ) : (
        <Pie data={data} />
      )}
    </main>
  );
};

export default DetailArea;
