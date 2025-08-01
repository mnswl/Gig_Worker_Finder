// Legacy stub maintained for backward compatibility of old imports.

export default function ExchangeRateChart() {
  return null;
}

/*
 *
 * Line chart showing historical exchange-rate trend for a currency pair.
 * Uses exchangerate.host timeseries endpoint (free, no-key) and Chart.js.
 *
 * @param {string} from source currency (e.g. "USD")
 * @param {string} to   target currency (e.g. "LKR")
 * @param {string} range one of '1M','3M','1Y','5Y' (defaults 1M)
 */
/*
// export default function ExchangeRateChart({ from, to, range = '1M' }) {
   = (null);
  const chartRef = (null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  (() => {
    if (!from || !to || from === to) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = import.meta.env.VITE_ALPHA_VANTAGE_KEY;
        if (!apiKey) {
          throw new Error('Missing Alpha Vantage API key');
        const subtractMonths = (m) => {
          start.setMonth(start.getMonth() - m);
        };
        const subtractYears = (y) => {
          start.setFullYear(start.getFullYear() - y);
        };
        switch (range) {
          case '3M':
            subtractMonths(3);
            break;
          case '1Y':
            subtractYears(1);
            break;
          case '5Y':
            subtractYears(5);
            break;
          default: // 1M
            subtractMonths(1);
        }
        const startDateStr = start.toISOString().slice(0, 10);
        // Use EUR as stable base to compute cross-rate (EUR→FROM and EUR→TO)
        const BASE_CURR = 'EUR';
        const url = https://api.exchangerate.host/timeseries?base=${BASE_CURR}&start_date=${startDateStr}&end_date=${endDateStr};
        const res = await fetch(url);
        if (!res.ok) throw new Error(HTTP ${res.status});
        const json = await res.json();
        if (!json.rates) throw new Error('No data');
        const labels = Object.keys(json.rates).sort();
        const valPairs = labels.map(d => {
          const dayRates = json.rates[d];
          const rateFrom = dayRates[from];
          const rateTo = dayRates[to];
          if (rateFrom && rateTo) {
            return { date: d, rate: rateTo / rateFrom };
          }
          return null;
        }).filter(Boolean);
        if (!valPairs.length) {
          // Fallback: fetch timeseries with direct base & symbol
          const directUrl = https://api.exchangerate.host/timeseries?base=${from}&symbols=${to}&start_date=${startDateStr}&end_date=${endDateStr};
          const directRes = await fetch(directUrl);
          if (directRes.ok) {
            const directJson = await directRes.json();
            const dirLabels = Object.keys(directJson.rates).sort();
            const dirPairs = dirLabels.map(d => {
              const rate = directJson.rates[d][to];
              return rate ? { date: d, rate } : null;
        const finalLabels = valPairs.map(p => p.date);
        const values = valPairs.map(p => p.rate);

        // Destroy old chart if exists
        if (chartRef.current) chartRef.current.destroy();
        const ctx = canvasRef.current.getContext('2d');
        chartRef.current = new Chart(ctx, {
          type: 'line',
          data: {
            labels: finalLabels,
            datasets: [
              {
                label: ${from} → ${to},
                data: values,
                fill: true,
                borderColor: '#4ade80',
                backgroundColor: 'rgba(74,222,128,0.15)',
                tension: 0.35,
              },
            ],
          },
          options: {
            responsive: true,
            scales: {
              x: {
                ticks: { autoSkip: true, maxTicksLimit: 8 },
              },
            },
            plugins: {
              legend: { display: false },
              tooltip: { intersect: false, mode: 'index' },
            },
          },
        });
      } catch (err) {
        (err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [from, to, range]);

  return (
    <div className="mt-4">
      {loading && <p className="text-muted small">Loading chart…</p>}
      {error && <p className="text-danger small">{error}</p>}
      <canvas ref={canvasRef} style={{ width: '100%', minHeight: 200 }} />
    </div>
  );
}
*/
