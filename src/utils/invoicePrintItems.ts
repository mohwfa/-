import { InvoiceManualItem } from '../types';

/**
 * Resolves the printable creator/accountant name for invoices and vouchers.
 * Replaces legacy/placeholder 'أنت' or blank values with the active system user's full name.
 */
export const resolvePrintableCreatorName = (
  createdBy?: string,
  currentUserFullName?: string
): string => {
  const trimmedCreator = (createdBy || '').trim();
  const trimmedCurrentUser = (currentUserFullName || '').trim();

  if (trimmedCreator && trimmedCreator !== 'أنت') {
    return trimmedCreator;
  }
  if (trimmedCurrentUser) {
    return trimmedCurrentUser;
  }
  return 'المسؤول المالي';
};

/**
 * Computes total price string when both quantity and unitPrice are valid numbers.
 * Returns null if either input is empty or non-numeric so manual totalPrice is preserved.
 */
export const computeManualItemTotal = (
  quantity?: string,
  unitPrice?: string
): string | null => {
  const qStr = (quantity || '').trim();
  const uStr = (unitPrice || '').trim();
  if (!qStr || !uStr) return null;

  const q = Number(qStr);
  const u = Number(uStr);
  if (!Number.isFinite(q) || !Number.isFinite(u) || q < 0 || u < 0) {
    return null;
  }

  return String(Number((q * u).toFixed(2)));
};

/**
 * Normalizes and strips completely empty manual item rows before persistence.
 */
export const sanitizeManualItems = (
  items: InvoiceManualItem[] = []
): InvoiceManualItem[] => {
  return items
    .map((item) => ({
      serial: (item.serial || '').trim(),
      name: (item.name || '').trim(),
      quantity: (item.quantity || '').trim(),
      unitPrice: (item.unitPrice || '').trim(),
      totalPrice: (item.totalPrice || '').trim(),
    }))
    .filter(
      (item) =>
        item.serial !== '' ||
        item.name !== '' ||
        item.quantity !== '' ||
        item.unitPrice !== '' ||
        item.totalPrice !== ''
    );
};

/**
 * Builds rows for the printable manual items table, padding with blank rows
 * up to minBlankRows so there is always dedicated space for manual writing.
 */
export const buildPrintableManualItemRows = (
  items: InvoiceManualItem[] = [],
  minBlankRows = 5
): InvoiceManualItem[] => {
  const cleaned = sanitizeManualItems(items);
  const targetLength = Math.max(cleaned.length, Math.max(0, minBlankRows));
  const rows: InvoiceManualItem[] = [...cleaned];

  while (rows.length < targetLength) {
    rows.push({ serial: '', name: '', quantity: '', unitPrice: '', totalPrice: '' });
  }

  return rows;
};
