const axios = require('axios');

class CurrencyConverter {
  constructor() {
    this.baseUrl = 'https://api.exchangerate-api.com/v4/latest';
    this.cache = new Map();
    this.cacheExpiry = 60 * 60 * 1000; // 1 hour in milliseconds
  }

  /**
   * Get exchange rates for a base currency
   * @param {string} baseCurrency - Base currency code (e.g., 'USD')
   * @returns {Promise<Object>} Exchange rates object
   */
  async getExchangeRates(baseCurrency) {
    const cacheKey = baseCurrency.toUpperCase();
    const now = Date.now();

    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (now - cached.timestamp < this.cacheExpiry) {
        return cached.data;
      }
    }

    try {
      const response = await axios.get(`${this.baseUrl}/${baseCurrency}`);
      const data = response.data;

      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: now
      });

      return data;
    } catch (error) {
      console.error('Error fetching exchange rates:', error.message);
      throw new Error('Failed to fetch exchange rates');
    }
  }

  /**
   * Convert amount from one currency to another
   * @param {number} amount - Amount to convert
   * @param {string} fromCurrency - Source currency code
   * @param {string} toCurrency - Target currency code
   * @returns {Promise<Object>} Conversion result with original and converted amounts
   */
  async convertCurrency(amount, fromCurrency, toCurrency) {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    // If same currency, no conversion needed
    if (from === to) {
      return {
        originalAmount: amount,
        originalCurrency: from,
        convertedAmount: amount,
        convertedCurrency: to,
        exchangeRate: 1,
        conversionDate: new Date().toISOString()
      };
    }

    try {
      // Get exchange rates from the source currency
      const rates = await this.getExchangeRates(from);
      
      if (!rates.rates[to]) {
        throw new Error(`Exchange rate not available for ${to}`);
      }

      const exchangeRate = rates.rates[to];
      const convertedAmount = Number((amount * exchangeRate).toFixed(2));

      return {
        originalAmount: amount,
        originalCurrency: from,
        convertedAmount,
        convertedCurrency: to,
        exchangeRate,
        conversionDate: rates.date || new Date().toISOString()
      };
    } catch (error) {
      console.error('Currency conversion error:', error.message);
      throw new Error(`Failed to convert ${from} to ${to}: ${error.message}`);
    }
  }

  /**
   * Get supported currencies
   * @returns {Array<string>} Array of supported currency codes
   */
  getSupportedCurrencies() {
    return [
      'USD', 'EUR', 'GBP', 'JPY', 'CNY', 'AUD', 'CAD', 'CHF', 'NZD', 'ZAR',
      'BRL', 'MXN', 'RUB', 'KRW', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'PLN',
      'THB', 'IDR', 'MYR', 'PHP', 'TRY', 'AED', 'SAR', 'EGP', 'NGN', 'KES',
      'GHS', 'INR'
    ];
  }

  /**
   * Clear cache (useful for testing or manual refresh)
   */
  clearCache() {
    this.cache.clear();
  }
}

module.exports = new CurrencyConverter();