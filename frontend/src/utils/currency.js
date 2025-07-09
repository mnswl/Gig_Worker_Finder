// Utility functions for handling currency symbols and conversion

const currencySymbols = {
  AUD: 'A$',
  CAD: 'C$',
  LKR: 'Rs.',
  USD: '$',
  INR: '₹',
  EUR: '€',
  GBP: '£',
};

export const getCurrencySymbol = (code) => currencySymbols[code] || code;

/**
 * Convert an amount from one currency to another using rates where the base currency is `base`
 * @param {number} amount  original amount
 * @param {string} from    currency code of the amount
 * @param {string} to      desired currency code
 * @param {object} rates   rates object where keys are other currency codes and values are their rate compared to base
 * @param {string} base    base currency of the `rates` object (default `to`)
 * @returns {number}
 */
export const convertAmount = (amount, from, to, rates, base = to) => {
  if (!rates || from === to) return amount;

  // If rates are based on the target currency (default behaviour in our app)
  if (base === to) {
    const rate = rates[from];
    if (!rate) return amount;
    return amount / rate; // because 1 to = rate[from] from
  }

  // Otherwise compute via cross-rate if available
  const rateToBase = base === from ? 1 : rates[from];
  const rateTargetToBase = base === to ? 1 : rates[to];
  if (!rateToBase || !rateTargetToBase) return amount;
  const amountInBase = amount / rateToBase;
  return amountInBase * rateTargetToBase;
};
