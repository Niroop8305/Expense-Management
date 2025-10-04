// Currency formatting utility

// Map of currency codes to their symbols
const currencySymbols = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  INR: "₹",
  JPY: "¥",
  CNY: "¥",
  AUD: "A$",
  CAD: "C$",
  CHF: "CHF",
  NZD: "NZ$",
  ZAR: "R",
  BRL: "R$",
  MXN: "Mex$",
  RUB: "₽",
  KRW: "₩",
  SGD: "S$",
  HKD: "HK$",
  NOK: "kr",
  SEK: "kr",
  DKK: "kr",
  PLN: "zł",
  THB: "฿",
  IDR: "Rp",
  MYR: "RM",
  PHP: "₱",
  TRY: "₺",
  AED: "د.إ",
  SAR: "﷼",
  EGP: "£",
  NGN: "₦",
  KES: "KSh",
  GHS: "₵",
  // Add more as needed
};

/**
 * Format an amount with currency symbol
 * @param {number} amount - The amount to format
 * @param {string} currencyCode - The currency code (e.g., "USD", "EUR")
 * @returns {string} Formatted string with currency symbol
 */
export function formatCurrency(amount, currencyCode) {
  if (!amount && amount !== 0) return "-";
  if (!currencyCode) return amount.toFixed(2);

  const symbol = currencySymbols[currencyCode] || currencyCode;
  const formattedAmount = Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol} ${formattedAmount}`;
}

/**
 * Get currency symbol for a currency code
 * @param {string} currencyCode - The currency code
 * @returns {string} Currency symbol
 */
export function getCurrencySymbol(currencyCode) {
  return currencySymbols[currencyCode] || currencyCode;
}
