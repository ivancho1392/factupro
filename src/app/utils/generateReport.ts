import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice } from "../models/invoiceModel";
import { getDecodedIdToken } from "../services/authService";

interface ReportParams {
  invoices: Invoice[];
  month: string;
  year: string;
  category: string;
  totalAmount: number;
  subTotalAmount: number;
  itbmsAmount: number;
}

export default async function generateReport({
  invoices,
  month,
  year,
  category,
  totalAmount,
  subTotalAmount,
  itbmsAmount,
}: ReportParams) {
  const doc = new jsPDF();
  const logo = new Image();
  const decoded = await getDecodedIdToken();
  const userEmail = decoded?.email || "Usuario desconocido";
  const currentDateTime = new Date().toLocaleString("es-PA");

  logo.src = "/logo.png";

  const monthName = getMonthName(month);

  doc.addImage(logo, "PNG", 10, 10, 50, 8);
  doc.setFontSize(16);
  doc.text("Reporte de Facturas", 105, 25, { align: "center" });

  doc.setFontSize(12);
  doc.text(`Mes: ${monthName}`, 10, 40);
  doc.text(`Año: ${year}`, 70, 40);
  doc.text(`Categoría: ${category || "Todas"}`, 130, 40);

  autoTable(doc, {
    startY: 50,
    head: [["Fecha", "Categoría", "Descripción", "Subtotal", "ITBMS", "Total"]],
    body: invoices.map((inv) => [
      new Date(inv.date).toLocaleDateString(),
      inv.category,
      inv.description,
      `$${inv.Subtotal.toFixed(2)}`,
      `$${inv.ITBMSUSD.toFixed(2)}`,
      `$${inv.value.toFixed(2)}`
    ]),
    theme: "grid",
    styles: { fontSize: 10 },
    headStyles: { fillColor: [0, 102, 51] },
  });

  const finalY = (doc as any).lastAutoTable.finalY || 60;

  doc.setFontSize(12);
  doc.text(`Subtotal: $${subTotalAmount.toFixed(2)}`, 10, finalY + 10);
  doc.text(`ITBMS: $${itbmsAmount.toFixed(2)}`, 10, finalY + 20);
  doc.text(`Total: $${totalAmount.toFixed(2)}`, 10, finalY + 30);
  doc.text(`Reporte descargado por: ${userEmail}`, 10, finalY + 45);
  doc.text(`Fecha y hora: ${currentDateTime}`, 10, finalY + 52);

  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text(
    "Este reporte es solo informativo y no puede ser usado para declaraciones contables oficiales.",
    10,
    finalY + 70,
    { maxWidth: 190 }
  );

  doc.save("reporte_facturas.pdf");
}

function getMonthName(month: string): string {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const index = parseInt(month, 10) - 1;
  return months[index] || "Mes desconocido";
}
