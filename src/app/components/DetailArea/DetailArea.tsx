import React from "react";
import InvoiceConsult from "../invoiceConsult";
import InvoiceUpload from "../invoiceUpload";
import InvoiceUploadIA from "../invoiceUploadIA";
import CalculadoraCotizaciones from "../quoteCalculator";
import { Pie } from "react-chartjs-2";
import styles from "../../styles/detailArea.module.css";
import { chartColors } from "../../home/colors";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import Image from "next/image";

type ActiveComponentType = "consult" | "upload" | "uploadIA" | "calculator" | null;

ChartJS.register(ArcElement, Tooltip, Legend);

interface DetailAreaProps {
  activeComponent: ActiveComponentType;
  context: {
    role: string;
    invoiceDataByMonth: Record<string, any>;
    currentMonth: string;
    currentPeriod: string;
  };
}

const monthNames = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];
const getMonthName = (monthNumber: string) => {
  const index = parseInt(monthNumber, 10) - 1;
  return monthNames[index] || "";
};

const DetailArea: React.FC<DetailAreaProps> = ({ activeComponent, context }) => {
  const { invoiceDataByMonth, role, currentPeriod } = context;
  const currentMonthData = invoiceDataByMonth[currentPeriod] || {};

  // Parse year and month from currentPeriod (format: YYYY-MM)
  const [year, month] = currentPeriod ? currentPeriod.split("-") : ["", ""];

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
      {/* Títulos contextuales */}
      {activeComponent === "consult" && (
        <h2 className="text-2xl mb-4 text-center">
          Facturas por categoría {getMonthName(month)} de {year || new Date().getFullYear()}
        </h2>
      )}

      {activeComponent === "calculator" && role === "Admin" && (
        <h2 className="text-2xl mb-4 text-center">
          Calculadora de Cotizaciones
        </h2>
      )}

      {/* Render condicional por rol */}
      {activeComponent === "uploadIA" && role === "Admin" && <InvoiceUploadIA />}
      {activeComponent === "consult" && role === "Admin" && <InvoiceConsult />}
      {activeComponent === "upload" && role === "Admin" && <InvoiceUpload />}

      {activeComponent === "consult" && role === "Externo" && <InvoiceConsult />}
      {activeComponent === "upload" && role === "Externo" && (
        <p>Función no permitida para este Role.</p>
      )}
      {activeComponent === "calculator" && role === "Admin" && (
        <CalculadoraCotizaciones />
      )}

      {!role && (
        <p>Usuario sin Role, comuníquese con el administrador por favor.</p>
      )}

      {/* Gráfico o bienvenida si no hay módulo activo ni datos */}
      {!["consult", "upload", "uploadIA", "calculator"].includes(activeComponent || "") && isEmptyData ? (
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <h2 className={styles.heroTitle}>Bienvenido a FactuPro</h2>
            <p className={styles.heroP}>
              Registra, organiza y consulta tus facturas en un solo lugar.
              Genera reportes por mes y categoría, exporta a PDF o Excel y
              analiza tus gastos con gráficos automáticos.
            </p>
            <ul className={styles.heroList}>
              <li> Carga y consulta de facturas</li>
              <li> Análisis inteligente</li>
              <li> Facturas categorizadas</li>
            </ul>
            <p className={styles.heroFoot}>
              Usa el menú lateral para empezar. Si necesitas ayuda, contacta al administrador.
            </p>
          </div>

          <div className={styles.heroImageWrap}>
            <Image
              src="/image1.png"
              alt="Funcionalidades de FactuPro"
              fill
              className={styles.heroImage}
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </section>
      ) : (
        !isEmptyData && activeComponent !== "calculator" && <Pie data={data} />
      )}
    </main>
  );
};

export default DetailArea;
