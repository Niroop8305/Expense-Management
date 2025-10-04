# Currency Implementation Guide

## Overview

This document describes the comprehensive currency implementation in the Expense Management System, which dynamically fetches countries and their currencies from the REST Countries API as specified in the problem statement.

## API Integration

### REST Countries API

**Endpoint:** `https://restcountries.com/v3.1/all?fields=name,currencies`

The system fetches all countries with their official currencies from this API during company registration. The API returns:

- Country common name
- Currency codes (ISO 4217)
- Currency names
- Currency symbols

## Implementation Details

### 1. Frontend - Registration Page (`frontend/src/pages/Register.jsx`)

#### Features:

- **Dynamic Country Loading**: Fetches all countries and currencies on component mount
- **Automatic Currency Selection**: When a country is selected, the currency is automatically populated
- **Sorted Country List**: Countries are displayed alphabetically for easy selection
- **Currency Display**: Shows currency code and symbol in the dropdown (e.g., "United States (USD - $)")
- **Disabled Currency Field**: Currency field is read-only and auto-populated based on country selection

#### Code Flow:

```javascript
1. Component mounts → useEffect triggers
2. Fetch countries from REST Countries API
3. Process response to extract country name, currency code, name, and symbol
4. Filter out countries without currency data
5. Sort countries alphabetically
6. Store in state
7. When user selects country → automatically set currency in form
```

### 2. Backend - Authentication Routes (`backend/src/routes/auth.js`)

#### Changes:

- **Removed Hardcoded Mapping**: Deleted the `countryCurrency` object that only supported 4 countries
- **Dynamic Currency Acceptance**: Now accepts `currency` field directly from frontend
- **Validation**: Ensures currency is provided during registration

#### API Endpoint:

```
POST /api/auth/register-company
Body: {
  companyName: string,
  country: string,
  currency: string,  // Now required from frontend
  adminName: string,
  adminEmail: string,
  adminPassword: string
}
```

### 3. Currency Utility (`frontend/src/utils/currency.js`)

#### Purpose:

Provides centralized currency formatting functions for consistent display across the application.

#### Features:

- **formatCurrency(amount, currencyCode)**: Formats amount with appropriate currency symbol
- **getCurrencySymbol(currencyCode)**: Returns symbol for a currency code
- **Extensive Symbol Support**: Includes 30+ currency symbols (USD, EUR, GBP, INR, JPY, etc.)
- **Number Formatting**: Uses locale-specific number formatting with thousand separators
- **Fallback Handling**: Defaults to currency code if symbol not found

#### Supported Currencies:

- USD ($), EUR (€), GBP (£), INR (₹), JPY (¥), CNY (¥)
- AUD (A$), CAD (C$), CHF, NZD (NZ$), ZAR (R), BRL (R$)
- MXN (Mex$), RUB (₽), KRW (₩), SGD (S$), HKD (HK$)
- NOK (kr), SEK (kr), DKK (kr), PLN (zł), THB (฿)
- IDR (Rp), MYR (RM), PHP (₱), TRY (₺), AED (د.إ)
- SAR (﷼), EGP (£), NGN (₦), KES (KSh), GHS (₵)

### 4. Dashboard Updates

All three dashboards have been updated to use the `formatCurrency` utility:

#### Employee Dashboard (`frontend/src/pages/EmployeeDashboard.jsx`)

- Expense submission form shows currency label
- Expense list displays amounts with currency symbols
- Statistics show formatted amounts

#### Manager Dashboard (`frontend/src/pages/ManagerDashboard.jsx`)

- Pending approvals show formatted amounts
- Team expenses display with currency symbols
- Total approved amount uses currency formatting
- Rejection modal shows formatted amount

#### Admin Dashboard (`frontend/src/pages/AdminDashboard.jsx`)

- Overview statistics show formatted approved amounts
- Expense list displays amounts with currency symbols
- All monetary values use consistent formatting

## User Experience Flow

### Registration:

1. User opens registration page
2. System loads all countries from REST Countries API
3. User selects company name
4. User selects country from dropdown (shows currency in parentheses)
5. Currency field auto-populates (read-only)
6. User completes admin details
7. System creates company with selected currency

### Login & Usage:

1. User logs in
2. User object includes company.currency
3. All dashboards display amounts with appropriate currency symbol
4. Expense submission uses company's currency
5. All reports and statistics show formatted amounts

## Data Storage

### Company Model (`backend/src/models/Company.js`)

```javascript
{
  name: String,
  country: String,     // Full country name (e.g., "United States")
  currency: String,    // ISO 4217 code (e.g., "USD")
  createdAt: Date
}
```

### Expense Model (`backend/src/models/Expense.js`)

```javascript
{
  amount: Number,
  currency: String,    // Inherited from company
  // ... other fields
}
```

## Benefits

1. **Global Support**: Supports all countries and their official currencies
2. **Automatic Updates**: Any currency changes in REST Countries API are automatically reflected
3. **User-Friendly**: Clear display of currency information during selection
4. **Consistent Formatting**: All amounts displayed with appropriate symbols
5. **Extensible**: Easy to add new currency symbols to the utility
6. **Problem Statement Compliance**: Fully implements the specified REST Countries API requirement

## Testing Checklist

- [ ] Test registration with various countries (USA, India, UK, Germany, Japan, etc.)
- [ ] Verify currency is automatically populated when country is selected
- [ ] Check that currency is saved correctly in the database
- [ ] Verify login returns user with company.currency
- [ ] Test expense submission with different currencies
- [ ] Verify all dashboards display amounts with correct currency symbols
- [ ] Check statistics and totals use proper currency formatting
- [ ] Test with countries that have multiple currencies (verify first currency is used)
- [ ] Verify graceful handling if REST Countries API is unavailable

## Future Enhancements

1. **Currency Conversion**: Add real-time currency conversion for multi-national companies
2. **Multi-Currency Support**: Allow companies to operate in multiple currencies
3. **Exchange Rate Integration**: Integrate with currency exchange rate APIs
4. **Currency Preferences**: Allow users to view amounts in their preferred currency
5. **Historical Exchange Rates**: Track expenses with historical exchange rates for accurate reporting

## Troubleshooting

### Issue: Countries not loading

**Solution**: Check internet connectivity and REST Countries API status

### Issue: Currency symbol not displaying correctly

**Solution**: Add the currency code to the `currencySymbols` object in `currency.js`

### Issue: Incorrect currency selected

**Solution**: Verify country selection - currency is auto-populated from the selected country

## API Response Example

```json
{
  "name": {
    "common": "United States"
  },
  "currencies": {
    "USD": {
      "name": "United States dollar",
      "symbol": "$"
    }
  }
}
```

## Conclusion

The currency implementation provides a robust, globally-applicable solution that meets the problem statement requirements. It automatically handles currency selection during registration and ensures consistent currency display throughout the application.
