import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
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

export default async function generateXLSXReport({
  invoices,
  month,
  year,
  category,
  totalAmount,
  subTotalAmount,
  itbmsAmount,
}: ReportParams) {
  const decoded = await getDecodedIdToken();
  const userEmail = decoded?.email || "Usuario desconocido";
  const currentDateTime = new Date().toLocaleString("es-PA");
  const monthName = getMonthName(month);

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Reporte");

  // Insertar el logo (debes tener el logo como base64 o un archivo png)
  const imageUrl = "/logo.png"; // Ruta pública en tu app (ej: public/logo.png)
  const imageBase64 = await fetch(imageUrl).then(res => res.blob()).then(blobToBase64);

  const imageId = workbook.addImage({
    base64: imageBase64 as string,
    extension: "png",
  });

  sheet.addImage(imageId, {
    tl: { col: 0, row: 0 },
    ext: { width: 221, height: 40 },
  });

  // Datos principales
  sheet.addRows([
    ["", ""],
    ["Mes", monthName],
    ["Año", year],
    ["Categoría", category || "Todas"],
    ["Generado por", userEmail],
    ["Fecha y hora", currentDateTime],
    [""],
    ["Este reporte es solo informativo y no puede ser usado para declaraciones contables oficiales."],
    [""],
  ]);

  // Encabezados
  const headers = ["Fecha", "Categoría", "Descripción", "Subtotal", "ITBMS", "Total"];
  const headerRow = sheet.addRow(headers);

  // Estilos de encabezado
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF006633" },
    };
    cell.font = { color: { argb: "FFFFFFFF" }, bold: true };
    cell.alignment = { horizontal: "center" };
    cell.border = {
      bottom: { style: "thin" },
    };
  });

  // Datos
  invoices.forEach((inv) => {
    sheet.addRow([
      new Date(inv.date).toLocaleDateString(),
      inv.category,
      inv.description,
      inv.Subtotal,
      inv.ITBMSUSD,
      inv.value,
    ]);
  });

  // Totales
  sheet.addRow([]);
  sheet.addRow(["", "", "Subtotal", subTotalAmount]);
  sheet.addRow(["", "", "ITBMS", itbmsAmount]);
  sheet.addRow(["", "", "Total", totalAmount]);

  // Ajuste de columnas
  sheet.columns = [
    { width: 12 },
    { width: 20 },
    { width: 50 },
    { width: 12 },
    { width: 12 },
    { width: 12 },
  ];

  // Guardar archivo
  const buffer = await workbook.xlsx.writeBuffer();
  saveAs(new Blob([buffer]), "reporte_facturas.xlsx");
}

async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function getMonthName(month: string): string {
  const months = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
  ];
  const index = parseInt(month, 10) - 1;
  return months[index] || "Mes desconocido";
}
