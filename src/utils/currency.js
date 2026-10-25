/**
 * Shared Hawker Balance & Currency Formatter
 * 
 * Rules:
 * - Positive number (> 0): Hawker owes (Unsettled debt).
 * - Zero (=== 0): Settled (No Dues).
 * - Negative number (< 0): Credit / Overpayment (Hub owes hawker).
 * - Always display NON-NEGATIVE currency values (never a minus sign).
 */

export function formatCurrency(amount) {
  const num = Math.abs(Number(amount) || 0);
  return `₹${num.toFixed(2)}`;
}

export function formatHawkerBalance(balance, options = {}) {
  const num = Number(balance) || 0;
  const absVal = Math.abs(num);
  const formatted = `₹${absVal.toFixed(2)}`;
  
  if (num > 0.001) {
    return {
      amount: num,
      absAmount: absVal,
      formatted,
      status: 'owes',
      label: 'Owes',
      colorClass: 'text-danger',
      color: 'var(--coral-red)',
      badgeClass: 'badge danger',
      fullText: options.withLabel ? `Owes ${formatted}` : formatted
    };
  } else if (num < -0.001) {
    return {
      amount: num,
      absAmount: absVal,
      formatted,
      status: 'credit',
      label: 'Credit',
      colorClass: 'text-success',
      color: 'var(--success-color)',
      badgeClass: 'badge success',
      fullText: options.withLabel ? `Credit ${formatted}` : formatted
    };
  } else {
    return {
      amount: 0,
      absAmount: 0,
      formatted: '₹0.00',
      status: 'settled',
      label: 'Settled',
      colorClass: 'text-secondary',
      color: 'var(--text-secondary)',
      badgeClass: 'badge info',
      fullText: options.withLabel ? 'Settled (₹0.00)' : '₹0.00'
    };
  }
}
