export interface Rate {
  value: string;
  label: string;
}

const rates = [
    { value: '', label: 'Seleccione ITBMS para esta factura' },
    { value: '0', label: '0%' },
    { value: '7', label: '7%' },
    { value: '10', label: '10%' },
  ];
  
  export default rates;

  export function calculateTotal(amount: string, rate: string): number {
    const amountValue = parseFloat(amount) || 0;
    const rateValue = parseFloat(rate) / 100 || 0;
    const total = amountValue * (1 + rateValue);

    // Redondear a dos decimales
    return Math.round(total * 100) / 100;
  }