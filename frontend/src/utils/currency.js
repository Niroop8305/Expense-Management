// Currency formatting utility
import axios from 'axios';

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

// Common currencies for dropdown
export const commonCurrencies = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
];

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

/**
 * Convert currency using the backend API
 * @param {number} amount - Amount to convert
 * @param {string} fromCurrency - Source currency
 * @param {string} toCurrency - Target currency
 * @returns {Promise<Object>} Conversion result
 */
export async function convertCurrency(amount, fromCurrency, toCurrency) {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(
      'http://localhost:5000/api/currency/convert',
      {
        amount,
        fromCurrency,
        toCurrency
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data.conversion;
  } catch (error) {
    console.error('Currency conversion error:', error);
    throw new Error(error.response?.data?.message || 'Failed to convert currency');
  }
}

/**
 * Get exchange rates for a base currency
 * @param {string} baseCurrency - Base currency code
 * @returns {Promise<Object>} Exchange rates
 */
export async function getExchangeRates(baseCurrency) {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(
      `http://localhost:5000/api/currency/rates/${baseCurrency}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('Exchange rates error:', error);
    throw new Error(error.response?.data?.message || 'Failed to get exchange rates');
  }
}
