import { useEffect, useRef, useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import Chart from 'chart.js/auto';

// Draw vertical dashed line at hovered point
const hoverLinePlugin = {
  id: 'hoverLine',
  afterDraw(chart) {
    if (chart.tooltip && chart.tooltip._active && chart.tooltip._active.length) {
      const ctx = chart.ctx;
      const activePoint = chart.tooltip._active[0];
      const x = activePoint.element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;
      ctx.save();
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = chart.options.hoverLineColor || 'rgba(55,65,81,0.5)';
      ctx.lineWidth = chart.options.hoverLineWidth || 1.5;
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.stroke();
      ctx.restore();
    }
  },
};
Chart.register(hoverLinePlugin);

/**
 * Exchange-rate trend chart using Alpha Vantage FX_DAILY API.
 * Requires REACT_APP_ALPHA_VANTAGE_KEY to be set in env (free key from https://www.alphavantage.co).
 * Shows last 30 closing prices for the selected currency pair.
 */
export default function AVExchangeRateChart({ from, to }) {
  const { darkMode } = useTheme();
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Helper to render the line chart (reused by both primary and fallback data paths)
  const renderChart = (labels, values) => {
    if (!canvasRef.current) return;
    // Destroy previous instance
    if (chartRef.current) chartRef.current.destroy();

    const ctx = canvasRef.current.getContext('2d');
    const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
    if (darkMode) {
      gradient.addColorStop(0, 'rgba(74,222,128,0.25)');
      gradient.addColorStop(1, 'rgba(17,24,39,0)');
    } else {
      gradient.addColorStop(0, 'rgba(34,197,94,0.25)');
      gradient.addColorStop(1, 'rgba(255,255,255,0)');
    }

    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: `${from} → ${to}`,
            data: values,
            pointRadius: 0,
            pointHoverRadius: 6,
            pointHoverBorderWidth: 2,
            pointHoverBackgroundColor: '#ffffff',
            pointHoverBorderColor: '#4ade80',
            fill: true,
            borderColor: darkMode ? '#4ade80' : '#16a34a',
            backgroundColor: gradient,
            tension: 0.35,
          },
        ],
      },
      options: {
        hoverLineColor: darkMode ? 'rgba(255,255,255,0.3)' : 'rgba(55,65,81,0.5)',
        hoverLineWidth: darkMode ? 1 : 1.5,
        responsive: true,
        interaction: { mode: 'index', intersect: false },
        elements: { point: { radius: 0, hoverRadius: 5, hitRadius: 12 } },
        scales: { x: { ticks: { autoSkip: true, maxTicksLimit: 8 } } },
        plugins: {
          legend: { display: false },
          tooltip: {
            yAlign: 'top',
            xAlign: 'center',
            backgroundColor: darkMode ? '#111827' : '#f3f4f6',
            titleColor: darkMode ? '#d1d5db' : '#111827',
            bodyColor: darkMode ? '#ffffff' : '#374151',
            padding: 8,
            displayColors: false,
            callbacks: {
              title: (ctx) => ctx[0].parsed.y.toFixed(2),
              label: (ctx) => {
                const date = ctx.label;
                return new Date(date).toLocaleDateString('en-US', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                });
              },
            },
          },
        },
      },
    });
  };

  useEffect(() => {
    if (!from || !to || from === to) return;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiKey = process.env.REACT_APP_ALPHA_VANTAGE_KEY;
        if (!apiKey) throw new Error('Missing Alpha Vantage API key');

        const url = `https://www.alphavantage.co/query?function=FX_DAILY&from_symbol=${from}&to_symbol=${to}&outputsize=compact&apikey=${apiKey}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const series = json['Time Series FX (Daily)'];
        if (!series) {
          // Fallback to exchangerate.host timeseries for the last 30 days
          const end = new Date().toISOString().substring(0, 10);
          const start = new Date(Date.now() - 29 * 86400000).toISOString().substring(0, 10);
          const fallbackUrl = `https://api.exchangerate.host/timeseries?start_date=${start}&end_date=${end}&base=${from}&symbols=${to}`;
          const fbRes = await fetch(fallbackUrl);
          const fbJson = await fbRes.json();
          let success = fbJson && fbJson.success;

          // Helper to validate we actually have usable rates
          const hasValidRates = (json, base, sym) =>
            json && json.rates && Object.values(json.rates)[0] && Object.values(json.rates)[0][sym] !== undefined;

          if (!success || !hasValidRates(fbJson, from, to)) {
            // Try inverse (to->from) and mathematically invert the rate
            const inverseUrl = `https://api.exchangerate.host/timeseries?start_date=${start}&end_date=${end}&base=${to}&symbols=${from}`;
            const invRes = await fetch(inverseUrl);
            const invJson = await invRes.json();
            if (invJson.success && hasValidRates(invJson, to, from)) {
              const invLabels = Object.keys(invJson.rates).sort();
              const invValues = invLabels.map(d => invJson.rates[d][from]);
              // invert each value to get from->to
              const values = invValues.map(v => (v ? 1 / v : null));
              renderChart(invLabels, values);
              return;
            }
            // Final fallback: Frankfurter API (no key, last ~365 days)
            try {
              const frUrl = `https://api.frankfurter.app/${start}..${end}?from=${from}&to=${to}`;
              const frRes = await fetch(frUrl);
              const frJson = await frRes.json();
              if (frJson && frJson.rates) {
                const frLabels = Object.keys(frJson.rates).sort();
                const frValues = frLabels.map(d => frJson.rates[d][to]);
                if (frValues.some(v => v !== undefined)) {
                  renderChart(frLabels, frValues);
                  return;
                }
              }
            } catch (e) {
              // ignore and fall through to error
            }
            setError('Historical data not available for this currency pair.');
            return;
          }

          const labels = Object.keys(fbJson.rates).sort();
          const values = labels.map(d => fbJson.rates[d][to]);
          renderChart(labels, values);
          return;
        }

        // Take the most recent 30 entries and render chart
        const sortedDates = Object.keys(series).sort().reverse().slice(0, 30).reverse();
        const labels = sortedDates;
        const values = sortedDates.map(d => parseFloat(series[d]['4. close']));
        renderChart(labels, values);
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (chartRef.current) chartRef.current.destroy();
    };
  }, [from, to, darkMode]);

  return (
    <div className="mt-4">
      {loading && <p className="text-muted small">Loading chart…</p>}
      {error && <p className="text-danger small">{error}</p>}
      <canvas ref={canvasRef} style={{ width: '100%', minHeight: 200 }} />
    </div>
  );
}
