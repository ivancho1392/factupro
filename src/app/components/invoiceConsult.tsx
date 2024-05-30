import React, { useState, useEffect } from 'react';
import styles from '../styles/invoiceConsult.module.css';
import months from '../utils/months';
import invoices from '../utils/invoices';
import categories from '../utils/categories';
import { jsPDF } from 'jspdf';

const InvoiceConsult: React.FC = () => {
  const [month, setMonth] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedInvoices, setSelectedInvoices] = useState<Array<{ id: number; date: string; category: string; description: string; amount: number; imageUrl: string }>>([]);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  useEffect(() => {
    // Recalcular el valor total cuando cambian las facturas seleccionadas
    const calculateTotalAmount = () => {
      const total = selectedInvoices.reduce((accumulator, currentInvoice) => accumulator + currentInvoice.amount, 0);
      setTotalAmount(total);
    };
    calculateTotalAmount();
  }, [selectedInvoices]);

  const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedMonth = event.target.value;
    setMonth(selectedMonth);
    filterInvoices(selectedMonth, selectedCategory);
  };

  const handleCategoryChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedCategory = event.target.value;
    setSelectedCategory(selectedCategory);
    filterInvoices(month, selectedCategory);
  };

  const filterInvoices = (selectedMonth: string, selectedCategory: string) => {
    let filteredInvoices = invoices;
    if (selectedMonth !== '') {
      const selectedMonthNumber = months.findIndex(month => month.value === selectedMonth) ;
      filteredInvoices = filteredInvoices.filter(invoice => {
        const invoiceMonth = new Date(invoice.date).getMonth() + 1;
        return invoiceMonth === selectedMonthNumber;
      });
    }
    if (selectedCategory !== '') {
      filteredInvoices = filteredInvoices.filter(invoice => invoice.category === selectedCategory);
    }
    setSelectedInvoices(filteredInvoices);
  };

  const generateReport = () => {
    const doc = new jsPDF();

    doc.setFontSize(10);
    let y = 25;

    const logo = new Image();
    logo.src = '/logo.png';
    doc.addImage(logo, 'PNG', 10, 10, 50, 10);


    let reportTitle = "Reporte de Facturas";
    if (month !== '') {
      reportTitle += ` mes ${months.find(m => m.value === month)?.label}`;
    }
    if (selectedCategory !== '') {
      reportTitle += ` categoría ${selectedCategory}`;
    }


    doc.text(reportTitle, 60, y);
    y += 10;

    doc.line(10, y, 200, y); 
    y += 5;

    selectedInvoices.forEach(invoice => {
      doc.text(`ID: ${invoice.id} | Fecha: ${invoice.date} | Categoría: ${invoice.category} | Descripción: ${invoice.description} | Valor: ${invoice.amount}`, 10, y);
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
      <select className={styles.selectMonth} value={month} onChange={handleMonthChange}>
        {months.map((monthOption, index) => (
          <option key={index} value={monthOption.value}>{monthOption.label}</option>
        ))}
      </select>
      
      <select className={styles.selectCategory} value={selectedCategory} onChange={handleCategoryChange}>
        <option value="">Todas las categorías</option>
        {categories.map((category, index) => (
          <option key={index} value={category}>{category}</option>
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
          {selectedInvoices.map(invoice => (
            <tr key={invoice.id}>
              <td>{invoice.id}</td>
              <td>{invoice.date}</td>
              <td>{invoice.category}</td>
              <td>{invoice.description}</td>
              <td>{invoice.amount}</td>
              <td><a href={invoice.imageUrl} target="_blank" rel="noopener noreferrer">Ver imagen</a></td>
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
      
      <button className={styles.reportButton} onClick={generateReport}>Generar Reporte</button>
    </div>
  );
};

export default InvoiceConsult;
