const express = require("express");
const router = express.Router();
const currencyConverter = require("../utils/currencyConverter");
const { authenticate } = require("../middleware/auth");

// GET /api/currency/rates/:baseCurrency - Get exchange rates for a base currency
router.get("/rates/:baseCurrency", authenticate, async (req, res) => {
  try {
    const { baseCurrency } = req.params;
    
    if (!baseCurrency || baseCurrency.length !== 3) {
      return res.status(400).json({ 
        message: "Valid 3-letter currency code is required" 
      });
    }

    const rates = await currencyConverter.getExchangeRates(baseCurrency.toUpperCase());
    
    res.json({
      success: true,
      baseCurrency: rates.base,
      date: rates.date,
      rates: rates.rates
    });
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    res.status(500).json({ 
      message: "Failed to fetch exchange rates",
      error: error.message 
    });
  }
});

// POST /api/currency/convert - Convert amount from one currency to another
router.post("/convert", authenticate, async (req, res) => {
  try {
    const { amount, fromCurrency, toCurrency } = req.body;

    // Validate input
    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        message: "Amount, fromCurrency, and toCurrency are required"
      });
    }

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        message: "Amount must be a positive number"
      });
    }

    if (fromCurrency.length !== 3 || toCurrency.length !== 3) {
      return res.status(400).json({
        message: "Currency codes must be 3 letters"
      });
    }

    const conversion = await currencyConverter.convertCurrency(
      parseFloat(amount), 
      fromCurrency, 
      toCurrency
    );

    res.json({
      success: true,
      conversion
    });
  } catch (error) {
    console.error("Error converting currency:", error);
    res.status(500).json({
      message: "Failed to convert currency",
      error: error.message
    });
  }
});

// GET /api/currency/supported - Get list of supported currencies
router.get("/supported", authenticate, async (req, res) => {
  try {
    const currencies = currencyConverter.getSupportedCurrencies();
    res.json({
      success: true,
      currencies
    });
  } catch (error) {
    console.error("Error getting supported currencies:", error);
    res.status(500).json({
      message: "Failed to get supported currencies",
      error: error.message
    });
  }
});

module.exports = router;