import React, { useState, useEffect, useContext } from "react";
import styles from "../styles/invoiceConsult.module.css";
import months from "../utils/months";
import categories from "../utils/categories";
import { jsPDF } from "jspdf";
import { getInvoices } from "../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  AiOutlinePicture,
  AiOutlineEdit,
  AiTwotoneDelete,
} from "react-icons/ai";
import { AppContext } from "../context";

const InvoiceConsult: React.FC = () => {
  const context = useContext(AppContext);
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
        } catch (error: any) {
          if (error.message === 'Unauthorized') {
            toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
          } else {
            toast.error('Error al cargar la factura. Por favor, inténtelo de nuevo más tarde.');
          }
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
        `Fecha: ${invoice.date} | Categoría: ${invoice.category} | Descripción: ${invoice.description} | Valor: ${invoice.value}`,
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

  const handleUpdate = (id: string) => {
    // Lógica para actualizar la factura con el ID proporcionado
    console.log("Actualizar factura con ID:", id);
  };

  const handleDelete = (id: string) => {
    // Lógica para eliminar la factura con el ID proporcionado
    console.log("Eliminar factura con ID:", id);
    context.openModal();
  };

  const handleView = (id: string) => {
    // Lógica para eliminar la factura con el ID proporcionado
    console.log("Ver factura con ID:", id);
    context.openModal();
  };

  return (
    <div className={styles.container}>
      {/* Select para meses */}
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

      {/* Select para categorías */}
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

      {/* Lista para mostrar facturas */}
      <div className={styles.invoiceList}>
        {filteredInvoices.map((invoice) => (
          <div key={invoice.id} className={styles.invoiceItem}>
            <div className={styles.invoiceDetails}>
              <div>
                <p>{invoice.date}</p>
                <p>{invoice.description}</p>
              </div>
              <div>
                <p className={styles.invoiceCategory}>{invoice.category}</p>
              </div>
            </div>
            <div>
              <div className={styles.invoiceDown}>
                <p className={styles.invoiceValue}>
                  ${invoice.value.toFixed(2)}
                </p>

                <div className={styles.invoiceButtons}>
                  <AiOutlinePicture
                    className={styles.viewButton}
                    onClick={() => handleView(invoice.id)}
                  />
                  <AiOutlineEdit
                    className={styles.updateButton}
                    onClick={() => handleUpdate(invoice.id)}
                  />
                  <AiTwotoneDelete
                    className={styles.deleteButton}
                    onClick={() => handleDelete(invoice.id)}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.totalAmount}>
        <p>Total: ${totalAmount.toFixed(2)}</p>
      </div>

      {/* Botón de generación de reporte */}
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
