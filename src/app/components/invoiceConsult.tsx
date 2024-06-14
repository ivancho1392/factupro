import React, { useState, useEffect } from "react";
import styles from "../styles/invoiceConsult.module.css";
import months from "../utils/months";
import categories from "../utils/categories";
import { jsPDF } from "jspdf";
import { getInvoices } from "../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const InvoiceConsult: React.FC = () => {
  const [month, setMonth] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [invoices, setInvoices] = useState<
    Array<{
      id: string;
      date: string;
      category: string;
      description: string;
      value: number;
      imageUrl: string;
    }>
  >([]);
  const [filteredInvoices, setFilteredInvoices] = useState<
    Array<{
      id: string;
      date: string;
      category: string;
      description: string;
      value: number;
      imageUrl: string;
    }>
  >([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  useEffect(() => {
    const calculateTotalAmount = () => {
      const total = filteredInvoices.reduce(
        (accumulator, currentInvoice) => accumulator + currentInvoice.value,
        0
      );
      setTotalAmount(total);
    };
    calculateTotalAmount();
  }, [filteredInvoices]);

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMonth = event.target.value;
    setMonth(selectedMonth);
  };

  useEffect(() => {
    const fetchInvoices = async () => {
      if (month) {
        try {
          const data = await getInvoices(`2024-${month}`);
          const transformedData = data.map((invoice: any) => {
            const date = new Date(invoice.Date);
            return {
              id: invoice.InvoiceId,
              date: date.toLocaleDateString("es-ES", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
              }),
              category: invoice.Category || "Sin Categoría",
              description: invoice.Description,
              value: invoice.Value,
              imageUrl: invoice.ImgLink,
            };
          });
          setInvoices(transformedData);
          filterInvoices(transformedData, selectedCategory);
          console.log(transformedData); // Aquí se imprimirá la respuesta transformada
          console.log("month:", month);
        } catch (error) {
          console.error("Error fetching invoices:", error);
        }
      }
    };
    fetchInvoices();
  }, [month]);

  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedCategory = event.target.value;
    setSelectedCategory(selectedCategory);
    filterInvoices(invoices, selectedCategory);
  };

  const filterInvoices = (
    invoicesToFilter: Array<{
      id: string;
      date: string;
      category: string;
      description: string;
      value: number;
      imageUrl: string;
    }>,
    category: string
  ) => {
    if (category !== "") {
      const filtered = invoicesToFilter.filter(
        (invoice) => invoice.category === category
      );
      setFilteredInvoices(filtered);
    } else {
      setFilteredInvoices(invoicesToFilter);
    }
  };

  const generateReport = () => {
    const doc = new jsPDF();

    doc.setFontSize(10);
    let y = 25;

    const logo = new Image();
    logo.src = "/logo.png";
    doc.addImage(logo, "PNG", 10, 10, 50, 10);

    let reportTitle = "Reporte de Facturas";
    if (month !== "") {
      reportTitle += ` mes ${months.find((m) => m.value === month)?.label}`;
    }
    if (selectedCategory !== "") {
      reportTitle += ` categoría ${selectedCategory}`;
    }

    doc.text(reportTitle, 60, y);
    y += 10;

    doc.line(10, y, 200, y);
    y += 5;

    filteredInvoices.forEach((invoice) => {
      doc.text(
        `ID: ${invoice.id} | Fecha: ${invoice.date} | Categoría: ${invoice.category} | Descripción: ${invoice.description} | Valor: ${invoice.value}`,
        10,
        y
      );
      y += 5;

      doc.line(10, y, 200, y);
      y += 5;
    });
    y += 10;
    doc.text(`Total: ${totalAmount}`, 10, y);
    doc.save("reporte_facturas.pdf");
  };

  return (
    <div className={styles.container}>
      <select
        className={styles.selectMonth}
        value={month}
        onChange={handleMonthChange}
      >
        <option value="01">Enero</option>
        <option value="02">Febrero</option>
        <option value="03">Marzo</option>
        <option value="04">Abril</option>
        <option value="05">Mayo</option>
        <option value="06">Junio</option>
        <option value="07">Julio</option>
        <option value="08">Agosto</option>
        <option value="09">Septiembre</option>
        <option value="10">Octubre</option>
        <option value="11">Noviembre</option>
        <option value="12">Diciembre</option>
      </select>

      <select
        className={styles.selectCategory}
        value={selectedCategory}
        onChange={handleCategoryChange}
      >
        <option value="">Todas las categorías</option>
        {categories.map((category, index) => (
          <option key={index} value={category}>
            {category}
          </option>
        ))}
      </select>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Fecha</th>
            <th>Categoría</th>
            <th>Descripción</th>
            <th>Valor</th>
            <th>Link Imagen</th>
          </tr>
        </thead>
        <tbody>
          {filteredInvoices.map((invoice) => (
            <tr key={invoice.id}>
              <td>{invoice.id}</td>
              <td>{invoice.date}</td>
              <td>{invoice.category}</td>
              <td>{invoice.description}</td>
              <td>{invoice.value}</td>
              <td>
                <a
                  href={invoice.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Ver imagen
                </a>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={4}>Total</td>
            <td>{totalAmount}</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <button
        className={styles.reportButton}
        onClick={generateReport}
        disabled={filteredInvoices.length === 0}
      >
        Generar Reporte
      </button>
      <ToastContainer />
    </div>
  );
};

export default InvoiceConsult;
