import React, { useState } from 'react';
import styles from '../styles/invoiceUpload.module.css';
import categories from '../utils/categories';

const InvoiceUpload: React.FC = () => {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Lógica para manejar la carga de archivos
  };

  const handleSubmit = () => {
    // Lógica para manejar la carga manual de facturas
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
    </div>
  );
};

export default InvoiceUpload;