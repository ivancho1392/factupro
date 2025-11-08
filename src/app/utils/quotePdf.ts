// src/app/utils/quotePdf.ts
import jsPDF from "jspdf";

export interface QuoteMarginLine {
  label: string;
  value: number;
}

export interface QuoteExportPayloadTotals {
  totalLabor: number;
  totalSupplies: number;
  totalTransport: number;
  totalEpp: number;
  totalOther: number;
  totalOvertime: number;
  baseCost: number;
  contingency: number;
  subtotal: number;
  margins: QuoteMarginLine[];
}

export interface QuoteExportPayload {
  version: number;
  createdAt: string; // ISO date
  state: any;        // estado completo del formulario
  totals: QuoteExportPayloadTotals;
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("es-PA", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(isNaN(n) ? 0 : n);

export const exportQuotePdf = (payload: QuoteExportPayload) => {
  const doc = new jsPDF();
  const { totals, state } = payload;

  let y = 10;

  doc.setFontSize(16);
  doc.text("Resumen de cotización", 10, y);
  y += 8;

  doc.setFontSize(10);
  doc.text(
    `Fecha de generación: ${new Date(payload.createdAt).toLocaleString()}`,
    10,
    y
  );
  y += 6;

  // Datos básicos
  doc.text(
    `Técnicos: ${state.qtyTechs ?? 0}  |  Ayudantes: ${
      state.qtyHelpers ?? 0
    }`,
    10,
    y
  );
  y += 5;
  doc.text(
    `Período: ${state.periodValue ?? 0} ${state.periodUnit ?? ""}`,
    10,
    y
  );
  y += 8;

  // Resumen de costos
  doc.setFontSize(12);
  doc.text("Resumen de costos", 10, y);
  y += 6;
  doc.setFontSize(10);

  const addLine = (label: string, value: number) => {
    doc.text(label, 12, y);
    doc.text(fmtCurrency(value), 120, y, { align: "right" });
    y += 5;
  };

  addLine("Mano de obra", totals.totalLabor);
  addLine("Insumos", totals.totalSupplies);
  addLine("Transporte", totals.totalTransport);
  addLine("EPP adicionales", totals.totalEpp);
  addLine("Otros", totals.totalOther);
  addLine("Horas extra (con aportes)", totals.totalOvertime);

  y += 2;
  doc.line(12, y, 200, y);
  y += 5;
  addLine("Costo base", totals.baseCost);
  addLine("Imprevistos (10%)", totals.contingency);
  addLine("Subtotal del proyecto", totals.subtotal);

  // Márgenes
  y += 8;
  doc.setFontSize(12);
  doc.text("Márgenes de utilidad sugeridos", 10, y);
  y += 6;
  doc.setFontSize(10);

  totals.margins.forEach((m) => {
    doc.text(`${m.label}`, 12, y);
    doc.text(fmtCurrency(m.value), 120, y, { align: "right" });
    y += 5;
  });

  const filenameBase =
    "cotizacion_" + payload.createdAt.slice(0, 10).replace(/-/g, "");
  doc.save(`${filenameBase}.pdf`);
};
