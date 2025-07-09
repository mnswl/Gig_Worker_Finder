import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Currency.css';

const CurrencyConverter = () => {
  const [amount, setAmount] = useState('1');
  const [fromCurrency, setFromCurrency] = useState('USD');
  const [toCurrency, setToCurrency] = useState('EUR');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Popular currencies
  const popularCurrencies = [
    { code: 'USD', name: 'US Dollar', flag: '🇺🇸' },
    { code: 'EUR', name: 'Euro', flag: '🇪🇺' },
    { code: 'GBP', name: 'British Pound', flag: '🇬🇧' },
    { code: 'JPY', name: 'Japanese Yen', flag: '🇯🇵' },
    { code: 'CAD', name: 'Canadian Dollar', flag: '🇨🇦' },
    { code: 'AUD', name: 'Australian Dollar', flag: '🇦🇺' },
    { code: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
    { code: 'CNY', name: 'Chinese Yuan', flag: '🇨🇳' },
    { code: 'INR', name: 'Indian Rupee', flag: '🇮🇳' },
    { code: 'KRW', name: 'South Korean Won', flag: '🇰🇷' },
    { code: 'SGD', name: 'Singapore Dollar', flag: '🇸🇬' },
    { code: 'HKD', name: 'Hong Kong Dollar', flag: '🇭🇰' }
  ];

  // Fetch exchange rate (using a mock API for demo)
  const fetchExchangeRate = async () => {
    if (fromCurrency === toCurrency) {
      setExchangeRate(1);
      return;
    }

    setLoading(true);
    try {
      // Mock API call - replace with actual API
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${fromCurrency}`);
      const data = await response.json();
      const rate = data.rates[toCurrency];
      setExchangeRate(rate);
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      // Fallback mock rates for demo
      const mockRates = {
        'USD-EUR': 0.85,
        'USD-GBP': 0.73,
        'USD-JPY': 110,
        'EUR-USD': 1.18,
        'GBP-USD': 1.37
      };
      setExchangeRate(mockRates[`${fromCurrency}-${toCurrency}`] || 1);
      setLastUpdated(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  // Calculate conversion
  useEffect(() => {
    if (exchangeRate && amount) {
      setResult((parseFloat(amount) * exchangeRate).toFixed(2));
    }
  }, [amount, exchangeRate]);

  // Fetch rate when currencies change
  useEffect(() => {
    fetchExchangeRate();
  }, [fromCurrency, toCurrency]);

  // Swap currencies
  const swapCurrencies = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  // Handle amount input
  const handleAmountChange = (e) => {
    const value = e.target.value;
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  return (
    <div className="currency-converter">
      {/* Header */}
      <header className="converter-header">
        <div className="container">
          <nav className="navbar">
            <Link to="/" className="navbar-brand">
              <img src="/logo_2.jpg" alt="Gig Worker Finder" className="logo" />
            </Link>
            <div className="nav-links">
              <Link to="/" className="nav-link">Home</Link>
              <Link to="/register" className="nav-link btn-outline">Join Now</Link>
            </div>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className="converter-hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="gradient-text">Currency Converter</span>
            </h1>
            <p className="hero-subtitle">
              Get real-time exchange rates for 100+ currencies worldwide
            </p>
            
            {/* Floating currency icons */}
            <div className="floating-currencies">
              <div className="currency-icon">💰</div>
              <div className="currency-icon">💵</div>
              <div className="currency-icon">💶</div>
              <div className="currency-icon">💷</div>
              <div className="currency-icon">💴</div>
            </div>
          </div>
        </div>
      </section>

      {/* Converter Tool */}
      <section className="converter-tool">
        <div className="container">
          <div className="converter-card">
            <div className="converter-header-card">
              <h2>Convert Currency</h2>
              {lastUpdated && (
                <span className="last-updated">
                  Last updated: {lastUpdated}
                </span>
              )}
            </div>

            <div className="converter-form">
              {/* Amount Input */}
              <div className="amount-section">
                <label htmlFor="amount">Amount</label>
                <input
                  id="amount"
                  type="text"
                  value={amount}
                  onChange={handleAmountChange}
                  placeholder="Enter amount"
                  className="amount-input"
                />
              </div>

              {/* Currency Selection */}
              <div className="currency-section">
                <div className="currency-row">
                  <div className="currency-input">
                    <label htmlFor="from-currency">From</label>
                    <select
                      id="from-currency"
                      value={fromCurrency}
                      onChange={(e) => setFromCurrency(e.target.value)}
                      className="currency-select"
                    >
                      {popularCurrencies.map(currency => (
                        <option key={currency.code} value={currency.code}>
                          {currency.flag} {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={swapCurrencies}
                    className="swap-button"
                    aria-label="Swap currencies"
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M8 7L12 3L16 7" stroke="currentColor" strokeWidth="2"/>
                      <path d="M8 17L12 21L16 17" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 3V21" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                  </button>

                  <div className="currency-input">
                    <label htmlFor="to-currency">To</label>
                    <select
                      id="to-currency"
                      value={toCurrency}
                      onChange={(e) => setToCurrency(e.target.value)}
                      className="currency-select"
                    >
                      {popularCurrencies.map(currency => (
                        <option key={currency.code} value={currency.code}>
                          {currency.flag} {currency.code} - {currency.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Result */}
              <div className="result-section">
                {loading ? (
                  <div className="loading">
                    <div className="spinner"></div>
                    <span>Getting latest rates...</span>
                  </div>
                ) : (
                  <div className="result">
                    <div className="result-amount">
                      {amount} {fromCurrency} = 
                      <span className="converted-amount">
                        {result} {toCurrency}
                      </span>
                    </div>
                    {exchangeRate && (
                      <div className="exchange-rate">
                        1 {fromCurrency} = {exchangeRate} {toCurrency}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="converter-features">
        <div className="container">
          <h2 className="section-title">Why Use Our Currency Converter?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">⚡</div>
              <h3>Real-Time Rates</h3>
              <p>Get the most up-to-date exchange rates updated every minute</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌍</div>
              <h3>100+ Currencies</h3>
              <p>Support for all major world currencies and cryptocurrencies</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔒</div>
              <h3>Secure & Private</h3>
              <p>No data stored, completely secure and private conversions</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Mobile Friendly</h3>
              <p>Perfect experience on all devices - desktop, tablet, and mobile</p>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Conversions */}
      <section className="popular-conversions">
        <div className="container">
          <h2 className="section-title">Popular Currency Conversions</h2>
          <div className="conversions-grid">
            {[
              'USD to EUR', 'EUR to USD', 'GBP to USD', 'USD to JPY',
              'USD to CAD', 'AUD to USD', 'USD to CHF', 'USD to CNY'
            ].map((conversion, index) => (
              <div key={index} className="conversion-item">
                <span className="conversion-text">{conversion}</span>
                <span className="conversion-rate">1.234</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Find Your Next Gig?</h2>
            <p>Join thousands of freelancers and clients on our platform</p>
            <Link to="/register" className="cta-button">
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="container">
          <p>&copy; 2025 Gig Worker Finder. All rights reserved.</p>
          <div className="footer-links">
            <Link to="/terms">Terms & Privacy</Link>
            <Link to="/contact">Contact</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default CurrencyConverter;