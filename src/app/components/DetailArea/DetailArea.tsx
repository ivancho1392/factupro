import React from "react";
import InvoiceConsult from "../invoiceConsult";
import InvoiceUpload from "../invoiceUpload";
import InvoiceUploadIA from "../invoiceUploadIA";
import { Pie } from "react-chartjs-2";
import styles from "../../styles/detailArea.module.css";
import { chartColors } from "../../home/colors";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";

// Define los posibles valores para `activeComponent`
type ActiveComponentType = "consult" | "upload" | "uploadIA" | null;

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
      {activeComponent === "consult" && (
        <h2 className="text-2xl mb-4 text-center">
          Facturas por categoría {getMonthName(currentMonth)} de 2024
        </h2>
      )}
      {activeComponent === "uploadIA" && role === "Admin" && <InvoiceUploadIA />}
      {activeComponent === "consult" && role === "Admin" && <InvoiceConsult />}
      {activeComponent === "upload" && role === "Admin" && <InvoiceUpload />}
      {activeComponent === "consult" && role === "Externo" && <InvoiceConsult />}
      {activeComponent === "upload" && role === "Externo" && (
        <p>Función no permitida para este Role.</p>
      )}
      {!role && (
        <p>Usuario sin Role, comuníquese con el administrador por favor.</p>
      )}

      
      {!["consult", "upload", "uploadIA"].includes(activeComponent || "") && isEmptyData ? (
        <div className="max-w-2xl mx-auto text-center p-6 bg-white/50 rounded-lg shadow-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Bienvenido a FactuPro
          </h2>
          <p className="text-gray-700 text-base leading-relaxed">
            Este sistema está diseñado para que TECHVERTICAL SA pueda registrar y consultar sus facturas de compra.
            <br /><br />
            Usa el menú lateral para subir nuevas facturas o consultar reportes por mes y categoría.
            También puedes generar reportes en formato PDF o Excel.
            <br /><br />
            Si tienes dudas, no dudes en contactar al administrador del sistema.
          </p>
        </div>
      ) : (
        !isEmptyData && <Pie data={data} />
      )}
    </main>
  );
};

export default DetailArea;
