import React, { useState, useContext } from 'react';
import styles from '../styles/invoiceUpload.module.css';
import categories from '../utils/categories';
import { createInvoice } from '../services/api';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AppContext } from '../context';

const InvoiceUpload: React.FC = () => {
  const context = useContext(AppContext);
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files && event.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error('Por favor, seleccione un archivo');
      return;
    }
    
    if (!amount || !category) {
      toast.error('Por favor, complete todos los campos');
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = async () => {
      const base64Data = fileReader.result?.toString().split(',')[1];
      context.openLoading();
      try {
        await createInvoice({
          UserName: 'Nombre de usuario',
          Value: Number(amount),
          Date: new Date().toISOString(),
          Description: description,
          Category: category,
          Content: base64Data || ''
        });
        toast.success('Factura cargada exitosamente');
        setTimeout(() => {
          window.location.href = '/home';
        }, 3000);
      } catch (error: any) {
        if (error.message === 'Unauthorized') {
          toast.error('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
        } else {
          toast.error('Error al cargar la factura. Por favor, inténtelo de nuevo más tarde.');
        }
        console.error('Error al cargar la factura:', error);
      } finally {
        context.closeLoading();
      }
    };
    fileReader.readAsDataURL(file);
  };

  return (
    <div className={styles.container}>
      <input
        type="file"
        onChange={handleFileUpload}
        className={styles.uploadButton}
      />
      <div className={styles.formGroup}>
        <label>Valor</label>
        <input
          type="text"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className={styles.input}
        />
      </div>
      <div className={styles.formGroup}>
        <label>Categoría</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={styles.select}
        >
          <option value="">Seleccione una categoria</option>
          {categories.map((category, index) => (
            <option key={index} value={category}>{category}</option>
          ))}
        </select>
      </div>
      <div className={styles.formGroup}>
        <label>Descripción (opcional)</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={styles.input}
        />
      </div>
      <button onClick={handleSubmit} className={styles.submitButton}>Cargar Factura</button>
      <ToastContainer />
    </div>
  );
};

export default InvoiceUpload;
