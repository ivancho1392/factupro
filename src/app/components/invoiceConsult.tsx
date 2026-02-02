import React, { useState, useEffect, useContext } from "react";
import styles from "../styles/invoiceConsult.module.css";
import categories from "../utils/categories";
import { getInvoices, deleteInvoice } from "../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import generateReport from "../utils/generateReport";
import generateXLSXReport from "../utils/generateXLSXReport";
import {
  AiOutlinePicture,
  AiOutlineEdit,
  AiTwotoneDelete,
} from "react-icons/ai";
import { AppContext } from "../context";
import { parseISO, format } from "date-fns";

interface Invoice {
  id: string;
  date: Date;
  category: string;
  description: string;
  value: number;
  imageUrl: string;
  userName: string;
  Subtotal: number;
  ITBMSUSD: number;
}
import { AiOutlineDownload } from "react-icons/ai";

const InvoiceConsult: React.FC = () => {
  const context = useContext(AppContext);
  const [month, setMonth] = useState<string>("01");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [filteredInvoices, setFilteredInvoices] = useState<Invoice[]>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [subTotalAmount, setSubTotalAmount] = useState<number>(0);
  const [itbmsAmount, setItbmsAmount] = useState<number>(0);
  const [invoiceToDelete, setInvoiceToDelete] = useState<string | null>(null);
  const [fileKeyToDelete, setFileKeyToDelete] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState<string>(String(currentYear));

  // Calcular totales
  useEffect(() => {
    const calculateTotalAmount = () => {
      const total = filteredInvoices.reduce(
        (accumulator, currentInvoice) => accumulator + currentInvoice.value,
        0
      );
      const subTotal = filteredInvoices.reduce(
        (accumulator, currentInvoice) =>
          accumulator + (currentInvoice.Subtotal || 0),
        0
      );
      const itbmsTotal = filteredInvoices.reduce(
        (accumulator, currentInvoice) =>
          accumulator + (currentInvoice.ITBMSUSD || 0),
        0
      );

      setTotalAmount(total);
      setSubTotalAmount(subTotal);
      setItbmsAmount(itbmsTotal);
    };
    calculateTotalAmount();
  }, [filteredInvoices]);

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMonth = event.target.value;
    setMonth(selectedMonth);
  };

  const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedYear = event.target.value;
    setSelectedYear(selectedYear);
  };

  //Fetch Invoices
  useEffect(() => {
    const fetchInvoices = async () => {
      if (month) {
        context.openLoading();
        try {
          const data = await getInvoices(`${selectedYear}-${month}`);
          // const data = await getInvoices(`2024-${month}`);
          const transformedData = data.map((invoice: any) => {
            return {
              id: invoice.InvoiceId,
              date: parseISO(invoice.Date), // Mantén la fecha como objeto Date
              category: invoice.Category || "Sin Categoría",
              description: invoice.Description,
              value: parseFloat(invoice.Value) || 0,
              imageUrl: invoice.ImgLink,
              userName: invoice.UserName,
              Subtotal: parseFloat(invoice.Subtotal || "0"),
              ITBMSUSD: parseFloat(invoice.ITBMSUSD || "0"),
            };
          });

          const sortedData = transformedData.sort(
            (a: Invoice, b: Invoice) => a.date.getTime() - b.date.getTime()
          );

          setInvoices(sortedData);
          filterInvoices(sortedData, selectedCategory);

          // Agrupar y sumar los valores por categoría
          const invoiceDataByCategory = sortedData.reduce(
            (acc: any, curr: any) => {
              acc[curr.category] = (acc[curr.category] || 0) + curr.value;
              return acc;
            },
            {}
          );
          const yearMonth = `${selectedYear}-${month}`;
          context.updateInvoiceDataByMonth(yearMonth, invoiceDataByCategory);
          context.setCurrentMonth(yearMonth);
          console.log("actual period:", context.currentMonth);
        } catch (error: any) {
          if (error.message === "Unauthorized") {
            toast.error(
              "Tu sesión ha expirado. Por favor, inicia sesión de nuevo."
            );
            setTimeout(() => {
              window.location.href = "/";
            }, 3000);
          } else {
            toast.error(
              "Error al consultar facturas. Por favor, inténtelo de nuevo más tarde."
            );
          }
        } finally {
          context.closeLoading();
        }
      }
    };
    fetchInvoices();
  }, [month, selectedYear, selectedCategory]);

  const handleCategoryChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selectedCategory = event.target.value;
    setSelectedCategory(selectedCategory);
    filterInvoices(invoices, selectedCategory);
  };

  const filterInvoices = (invoicesToFilter: Invoice[], category: string) => {
    if (category !== "") {
      const filtered = invoicesToFilter.filter(
        (invoice) => invoice.category === category
      );
      setFilteredInvoices(filtered);
    } else {
      setFilteredInvoices(invoicesToFilter);
    }
  };

  const handleGenerateReport = () => {
    generateReport({
      invoices: filteredInvoices,
      month: month,
      year: selectedYear,
      category: selectedCategory,
      totalAmount: totalAmount,
      subTotalAmount: subTotalAmount,
      itbmsAmount: itbmsAmount,
    });
  };

  const handleGenerateExcelReport = () => {
    generateXLSXReport({
      invoices: filteredInvoices,
      month: month,
      year: selectedYear,
      category: selectedCategory,
      totalAmount: totalAmount,
      subTotalAmount: subTotalAmount,
      itbmsAmount: itbmsAmount,
    });
  };

  const handleUpdate = (id: string) => {
    // Lógica para actualizar la factura con el ID proporcionado
    console.log("Actualizar factura con ID:", id);
  };

  const handleDelete = (id: string, fileKey: string) => {
    setInvoiceToDelete(id);
    setFileKeyToDelete(fileKey);
    context.openModal();
  };

  const confirmDelete = async () => {
    if (invoiceToDelete && fileKeyToDelete) {
      context.closeModal();
      context.openLoading();
      try {
        await deleteInvoice(invoiceToDelete, fileKeyToDelete);
        // Elimina la factura de la lista local después de la eliminación exitosa
        setFilteredInvoices(
          filteredInvoices.filter((invoice) => invoice.id !== invoiceToDelete)
        );
        toast.success("Factura eliminada exitosamente.");
      } catch (error: any) {
        if (error.message === "Unauthorized") {
          toast.error(
            "Tu sesión ha expirado. Por favor, inicia sesión de nuevo."
          );
          setTimeout(() => {
            window.location.href = "/";
          }, 3000);
        } else {
          toast.error(
            "Error al eliminar factura. Por favor, inténtelo de nuevo más tarde."
          );
        }
      } finally {
        context.closeLoading();
        setInvoiceToDelete(null);
        setFileKeyToDelete(null);
      }
    }
  };

  const handleView = (imageUrl: string) => {
    window.open(imageUrl, "_blank");
  };

  // Función para deshabilitar los meses posteriores al mes actual
  const disableFutureMonths = () => {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;

    const selectElement = document.getElementById(
      "monthSelect"
    ) as HTMLSelectElement;

    for (let i = 0; i < selectElement.options.length; i++) {
      const optionValue = parseInt(selectElement.options[i].value);

      // Si es el año actual, deshabilita los meses futuros
      if (
        parseInt(selectedYear) === currentYear &&
        optionValue > currentMonth
      ) {
        selectElement.options[i].disabled = true;
      } else {
        selectElement.options[i].disabled = false;
      }
    }
  };

  // Llama a disableFutureMonths cuando el componente se monte
  useEffect(() => {
    disableFutureMonths();
  }, [selectedYear]);

  return (

    <div className={styles.container}>
      {/* Select para meses */}
      <select
        id="monthSelect"
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

      {/* Select para años */}
      <select
        id="yearSelect"
        className={styles.selectYear}
        value={selectedYear}
        onChange={handleYearChange}
      >
        {(() => {
          const START_YEAR = 2024;
          const years = Array.from(
            { length: currentYear - START_YEAR + 2 },
            (_, i) => String(START_YEAR + i)
          );
          return years.map((year) => (
            <option key={year} value={year}>
              {year}
            </option>
          ));
        })()}
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
          <div key={invoice.id} className={styles.invoiceCard}>
            <div className={styles.cardHeader}>
              <h3 className={styles.invoiceTitle}>{invoice.description}</h3>
              <span className={styles.invoiceDate}>{format(new Date(invoice.date), "dd/MM/yyyy")}</span>
            </div>

            <div className={styles.cardBody}>
              <div className={styles.cardInfoLeft}>
                <p><strong>Categoría:</strong> {invoice.category}</p>
                <p><strong>Usuario:</strong> {invoice.userName}</p>
              </div>
              <div className={styles.cardInfoRight}>
                <p>
                  <strong>Subtotal:</strong> ${invoice.Subtotal.toFixed(2)} |{" "}
                  <strong>ITBMS:</strong> ${invoice.ITBMSUSD.toFixed(2)}
                </p>
                <p><strong>Total:</strong> ${invoice.value.toFixed(2)}</p>
              </div>
            </div>

            <div className={styles.cardActions}>
              <AiOutlinePicture className={styles.iconAction} onClick={() => handleView(invoice.imageUrl)} />
              {context.role === "Admin" && (
                <>
                  <AiOutlineEdit className={styles.iconAction} onClick={() => handleUpdate(invoice.id)} />
                  <AiTwotoneDelete className={styles.iconDelete} onClick={() => handleDelete(invoice.id, invoice.imageUrl)} />
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredInvoices.length > 0 && (
        <>
          <div className={styles.totalAmount}>
            <p>SubTotal: ${subTotalAmount.toFixed(2)}</p>
          </div>

          <div className={styles.totalAmount}>
            <p>ITBMS: ${itbmsAmount.toFixed(2)}</p>
          </div>

          <div className={styles.totalAmount}>
            <p>Total: ${totalAmount.toFixed(2)}</p>
          </div>
        </>
      )}


      {filteredInvoices.length > 0 && (
        <div className={styles.reportButtons}>
          <button
            className={styles.reportBtn}
            onClick={handleGenerateReport}
          >
            <AiOutlineDownload className={styles.downloadIcon} />
            Generar PDF
          </button>

          <button
            className={styles.reportBtn}
            onClick={handleGenerateExcelReport}
          >
            <AiOutlineDownload className={styles.downloadIcon} />
            Generar Excel
          </button>
        </div>
      )}

      {/*Modal de confimacion de eliminacion */}
      <div className={context.modal ? styles.modalopen : styles.modalclose}>
        {context.modal && (
          <div className={styles.modalContent}>
            <h2 className="text-2xl font-bold">Confirmación</h2>
            <p className="mt-4">
              ¿Estas seguro de que quieres eliminar esta factura?
            </p>
            <button
              onClick={confirmDelete}
              className="mt-4 p-2 bg-custom-red mr-8 text-white rounded hover:bg-gray-700 transition duration-300"
            >
              Eliminar
            </button>
            <button
              onClick={context.closeModal}
              className="mt-4 p-2 bg-gray-500 text-white rounded hover:bg-gray-700 transition duration-300"
            >
              Volver
            </button>
          </div>
        )}
      </div>
      <ToastContainer />
    </div>
  );
};

export default InvoiceConsult;
