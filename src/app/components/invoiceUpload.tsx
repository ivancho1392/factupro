import React, { useState, useContext } from "react";
import styles from "../styles/invoiceUpload.module.css";
import categories from "../utils/categories";
import rates, { calculateTotal } from "../utils/rates";
import { createInvoice } from "../services/api";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { AppContext } from "../context";

const InvoiceUpload: React.FC = () => {
  const context = useContext(AppContext);
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().substr(0, 10)
  );
  const [selectedRate, setSelectedRate] = useState<string>("");

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Reemplazar ',' con '.' y eliminar caracteres no válidos
    value = value.replace(",", ".").replace(/[^0-9.]/g, "");

    // Validar que solo haya un punto decimal
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleITBMSChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    // Reemplazar ',' con '.' y eliminar caracteres no válidos
    value = value.replace(",", ".").replace(/[^0-9.]/g, "");

    // Validar que solo haya un punto decimal
    if (/^\d*\.?\d*$/.test(value)) {
      setSelectedRate(value);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files && event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error("Por favor, seleccione un archivo");
      return;
    }

    if (!amount || !selectedRate || !category || !invoiceDate) {
      toast.error("Por favor, complete todos los campos");
      return;
    }

    // Convertir a números y validar
    const numericAmount = parseFloat(amount.replace(",", "."));
    const numericRate = parseFloat(selectedRate.replace(",", "."));

    if (isNaN(numericAmount) || isNaN(numericRate)) {
      toast.error(
        "Por favor, ingrese valores numéricos válidos para el subtotal e ITBMS"
      );
      return;
    }

    const totalAmount = numericAmount + numericRate;

    const fileReader = new FileReader();
    fileReader.onload = async () => {
      const base64Data = fileReader.result?.toString().split(",")[1];
      context.openLoading();
      try {
        console.log(
          "Cargando factura:",
          "Value:",
          totalAmount,
          "Subtotal:",
          numericAmount,
          "ITBMS:",
          numericRate
        );
        await createInvoice({
          UserName: "Nombre de usuario",
          Value: totalAmount,
          Date: invoiceDate,
          Description: description,
          Category: category,
          Content: base64Data || "",
          ITBMSUSD: numericRate,
          Subtotal: numericAmount,
        });
        toast.success("Factura cargada exitosamente");
        setTimeout(() => {
          window.location.href = "/home";
        }, 3000);
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
            "Error al cargar la factura. Por favor, inténtelo de nuevo más tarde."
          );
        }
        console.error("Error al cargar la factura:", error);
      } finally {
        context.closeLoading();
      }
    };
    fileReader.readAsDataURL(file);
  };

  return (
    <div className={styles.container}>
      <div className={styles.stepContainer}>
        {/* Paso 1 */}
        <div className={styles.step}>
          <h3>Paso 1.</h3>
          <div className={styles.inputfile}>
            <label htmlFor="fileInput" className={styles.uploadButton}>
              Seleccionar factura
            </label>
            <input
              id="fileInput"
              type="file"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />
            <p className={styles.fileDescription}>
              {!file ? "No has seleccionado ninguna factura" : file.name}
            </p>
          </div>
          <p className={styles.stepDescription}>
            Selecciona la factura a cargar en el sistema. Puede ser una foto de
            tu galería, un PDF, o puedes cargar una foto con tu cámara.
          </p>
        </div>

        {/* Paso 2 */}
        <div className={styles.step}>
          <h3>Paso 2.</h3>
          <div className={styles.formGroup}>
            <div className={styles.item2}>
              <label>Subtotal (USD)</label>
              <input
                type="text"
                value={amount}
                onChange={handleAmountChange}
                className={styles.input}
              />
              <label>ITBMS (USD)</label>
              <input
                type="text"
                value={selectedRate}
                onChange={handleITBMSChange}
                className={styles.input}
              />
              <h3>Total</h3>
              <p>
                $
                {(parseFloat(amount) + parseFloat(selectedRate || "0")).toFixed(
                  2
                )}
              </p>
            </div>
          </div>
          <p className={styles.stepDescription}>
            Asigna un valor sin itbms a tu factura, después discrimina el ITBMS,
            Asegúrate de que corresponda al valor real.
          </p>
        </div>

        {/* Paso 3 */}
        <div className={styles.step}>
          <h3>Paso 3.</h3>
          <div className={styles.formGroup}>
            <label>Categoría</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className={styles.select}
            >
              <option value="">Seleccione una categoría</option>
              {categories.map((category, index) => (
                <option key={index} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
          <p className={styles.stepDescription}>
            Selecciona la categoria correspondiente a tu factura.
          </p>
        </div>

        {/* Paso 4 */}
        <div className={styles.step}>
          <h3>Paso 4. </h3>
          <div className={styles.formGroup}>
            <label>Descripción (opcional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles.input}
            />
          </div>
          <p className={styles.stepDescription}>
            Agrega una descripción u observación para esta factura. Puedes
            detallar cualquier información adicional relevante.
          </p>
        </div>

        {/* Paso 5 */}
        <div className={styles.step}>
          <h3>Paso 5.</h3>
          <div className={styles.formGroup}>
            <label>Fecha de la factura</label>
            <input
              type="date"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
              className={styles.input}
            />
          </div>
          <p className={styles.stepDescription}>
            La factura llevará la fecha de hoy. Si es de otra fecha, puedes
            modificarla según sea necesario.
          </p>
        </div>
      </div>

      <button onClick={handleSubmit} className={styles.submitButton}>
        Cargar Factura
      </button>
      <ToastContainer />
    </div>
  );
};

export default InvoiceUpload;
