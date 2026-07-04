export const INVOICE_HISTORY_LOCK_ENABLED = true;

// Bloquea mayo 2026 hacia atrás.
// Primer mes permitido: junio 2026.
export const MIN_ALLOWED_INVOICE_PERIOD = {
  year: 2026,
  month: 6,
};

export const isInvoicePeriodDisabled = (
  year: string | number,
  month: string | number
) => {
  if (!INVOICE_HISTORY_LOCK_ENABLED) return false;

  const numericYear = Number(year);
  const numericMonth = Number(month);

  return (
    numericYear < MIN_ALLOWED_INVOICE_PERIOD.year ||
    (numericYear === MIN_ALLOWED_INVOICE_PERIOD.year &&
      numericMonth < MIN_ALLOWED_INVOICE_PERIOD.month)
  );
};