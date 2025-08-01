import { useState } from 'react';
import useExchangeRates from '../hooks/useExchangeRates';
import { currencies } from '../data/options';
import { getCurrencySymbol } from '../utils/currency';
import AVExchangeRateChart from '../components/AVExchangeRateChart';
import { useTranslation } from 'react-i18next';

export default function CurrencyConverter() {
  const { t } = useTranslation();

  // State
  const [amount, setAmount] = useState('');
  const [fromCurr, setFromCurr] = useState('USD');
  const [toCurr, setToCurr] = useState('LKR');

  // Fetch exchange rates with the *source* currency as the base so we can directly multiply
  const { rates, lastUpdated } = useExchangeRates(fromCurr);

  // Currency codes list (already array)
  const currencyCodes = currencies;

  // Swap currencies
  const handleSwapCurrencies = () => {
    setFromCurr(prevFrom => {
      setToCurr(prevFrom);
      return toCurr;
    });
  }

  const numericAmount = amount === '' ? 1 : parseFloat(amount);
  const displayAmount = numericAmount.toLocaleString(undefined, { minimumFractionDigits: 2 });
  const converted = (rates && rates[toCurr] && !isNaN(numericAmount))
    ? (numericAmount * rates[toCurr]).toFixed(2)
    : null;

  return (
    <div className="container py-5" data-aos="fade-up">
      <h1 className="mb-4 text-center">{t('currencyConverter', 'Currency Converter')}</h1>
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card p-4 shadow-sm glass-card">
            <div className="mb-3">
              <label htmlFor="amount" className="form-label fw-semibold">{t('amount', 'Amount')}</label>
              <input
                type="number"
                id="amount"
                className="form-control"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                min="0"
                step="0.01"
              />
            </div>

            <div className="d-flex gap-2 mb-3 align-items-end">
              <div className="flex-fill">
                <label className="form-label fw-semibold">{t('from', 'From')}</label>
                <select className="form-select" value={fromCurr} onChange={e => setFromCurr(e.target.value)}>
                  {currencyCodes.map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>
              <button type="button" className="btn btn-outline-secondary" onClick={handleSwapCurrencies} aria-label={t('switch', 'Switch')}>
                ⇄
              </button>
              <div className="flex-fill">
                <label className="form-label fw-semibold">{t('to', 'To')}</label>
                <select className="form-select" value={toCurr} onChange={e => setToCurr(e.target.value)}>
                  {currencyCodes.map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Historical trend chart */}
            <AVExchangeRateChart from={fromCurr} to={toCurr} />

            <div className="mt-4 text-center">
              {rates ? (
                <>
                  <h4>
                    {getCurrencySymbol(fromCurr)} {displayAmount}
                    {' = '}
                    {getCurrencySymbol(toCurr)} {converted}
                  </h4>
                  {lastUpdated && (
                    <p className="text-muted small mb-0">
                      {t('ratesUpdated', 'Rates updated at')}: {lastUpdated.toLocaleString()}
                    </p>
                  )}
                </>
              ) : (
                <p>{t('loading', 'Loading exchange rates...')}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
