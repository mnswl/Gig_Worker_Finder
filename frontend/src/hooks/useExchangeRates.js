import { useEffect, useState } from 'react';

/**
 * React hook to load (and cache) daily foreign-exchange rates for a given base currency.
 * Rates are stored in localStorage under the key `fx_rates_<BASE>` so we only hit the
 * public API once per day.
 *
 * @param {string} base ISO 4217 currency code (e.g. "USD")
 * @returns {{ rates: object|null, loading: boolean, error: string|null }}
 */
export default function useExchangeRates(base) {
  const [rates, setRates] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!base) return;

    const STORAGE_KEY = `fx_rates_${base}`;
    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const cachedRaw = localStorage.getItem(STORAGE_KEY);
    if (cachedRaw) {
      try {
        const cached = JSON.parse(cachedRaw);
        if (cached.date === today && cached.data) {
          setRates(cached.data);
          setLastUpdated(new Date(cached.ts || cached.date));
          setLoading(false);
          return; // fresh cache
        }
      } catch (_) {
        // fall through – bad cache format
      }
    }

    /** Fetch fresh rates from public providers (primary → open.er-api.com, fallback → exchangerate.host) */
    const fetchRates = async () => {
      setLoading(true);
      // Build provider list: check env first (comma-separated URLs with {BASE} placeholder)
      const envList = (process.env.REACT_APP_FX_PROVIDERS || '').split(',').map(s=>s.trim()).filter(Boolean);
      const dynamicProviders = envList.map(url=>({
        name:url,
        buildUrl:(b)=> url.replace('{BASE}', b),
        extract:(json)=> json?.rates || json?.conversion_rates || json?.quotes,
      }));

      const providers = dynamicProviders.length > 0 ? dynamicProviders : [
        {
          name: 'open.er-api.com',
          buildUrl: (b) => `https://open.er-api.com/v6/latest/${b}`,
          extract: (json) => json?.rates || json?.conversion_rates || json?.quotes,
        },
        {
          name: 'exchangerate.host',
          buildUrl: (b) => `https://api.exchangerate.host/latest?base=${b}`,
          extract: (json) => json?.rates || json?.conversion_rates || json?.quotes,
        },
      ];

      let lastErr = null;
      for (const p of providers) {
        try {
          const res = await fetch(p.buildUrl(base));
          if (!res.ok) throw new Error(`${p.name} HTTP ${res.status}`);
          const json = await res.json();
          let r = p.extract(json);
          const providerBase = json.base || json.base_code || json.source;
          if (providerBase && providerBase !== base && r && r[base]) {
            const factor = r[base]; // rate of requested base vs providerBase
            const norm = {};
            for (const [k, v] of Object.entries(r)) {
              norm[k] = v / factor; // convert so that requested base becomes 1
            }
            r = norm;
          }
          // Handle currencylayer-style 'quotes' object (keys like "USDEUR")
          if (r && typeof r === 'object' && !Array.isArray(r)) {
            const keys = Object.keys(r);
            if (keys.length && keys.every(k => k.startsWith(base))) {
              const stripped = {};
              for (const k of keys) {
                stripped[k.slice(base.length)] = r[k];
              }
              r = stripped;
            }
          }
          if (!r) throw new Error(`${p.name} missing rates`);
          setRates(r);
          setLastUpdated(new Date());
          localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: today, ts: new Date().toISOString(), data: r }));
          setError(null);
          return; // success
        } catch (err) {
          console.warn(`Provider ${p.name} failed`, err);
          lastErr = err;
        }
      }
      // if we reach here, all providers failed
      setError(lastErr?.message || 'All FX providers failed');
    };

    fetchRates();
  }, [base]);

  return { rates, loading, error, lastUpdated };
}
