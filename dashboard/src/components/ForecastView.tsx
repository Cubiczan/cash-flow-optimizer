import { FunctionComponent } from 'preact';
import { forecastData } from '../data';
import { ForecastChart } from './ForecastChart';

const fmtM = (n: number) => `$${(n / 1000000).toFixed(3)}M`;
const fmtK = (n: number) => n === 0 ? '-' : `$${(n / 1000).toFixed(0)}K`;

export const ForecastView: FunctionComponent = () => {
  const minProjected = Math.min(...forecastData.map(d => d.projected));
  const maxProjected = Math.max(...forecastData.map(d => d.projected));
  const avgProjected = forecastData.reduce((s, d) => s + d.projected, 0) / forecastData.length;
  const wk13End = forecastData[forecastData.length - 1].projected;
  const growthPct = (((wk13End - forecastData[0].projected) / forecastData[0].projected) * 100).toFixed(1);

  return (
    <div class="view">
      <div class="view-header">
        <div>
          <h1>13-Week Cash Flow Forecast</h1>
          <p>Rolling forecast · Xero + Precoro · LLM-powered analysis · Generated Mon 5 May 2026</p>
        </div>
        <button class="btn-sync">↻ Regenerate</button>
      </div>

      {/* Summary KPIs */}
      <div class="forecast-summary-grid">
        <div class="kpi-card accent">
          <div class="kpi-label">Current Cash</div>
          <div class="kpi-value emerald">{fmtM(forecastData[0].projected)}</div>
          <div class="kpi-sub">Week 0 baseline</div>
        </div>
        <div class="kpi-card warn">
          <div class="kpi-label">13-Week Floor</div>
          <div class="kpi-value amber">{fmtM(minProjected)}</div>
          <div class="kpi-sub">Week 6 · lowest point</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">13-Week Peak</div>
          <div class="kpi-value">{fmtM(maxProjected)}</div>
          <div class="kpi-sub">Week 13 · end of period</div>
        </div>
        <div class="kpi-card accent">
          <div class="kpi-label">Period Growth</div>
          <div class="kpi-value emerald">+{growthPct}%</div>
          <div class="kpi-sub">Now → Week 13</div>
        </div>
      </div>

      {/* Full chart */}
      <div class="panel" style={{ marginBottom: '14px' }}>
        <div class="panel-header">
          <span class="panel-title">Cash Position Projection</span>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
            Amber points = warning zone · Dashed lines = thresholds
          </span>
        </div>
        <ForecastChart compact={false} />
      </div>

      {/* Detail table */}
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Week-by-Week Detail</span>
          <span class="panel-badge amber">⚠ Weeks 5-6 below $2M working capital target</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table class="forecast-table">
            <thead>
              <tr>
                <th>Period</th>
                <th>Projected Cash</th>
                <th>AR Inflow</th>
                <th>AP Outflow</th>
                <th>PO Outflow</th>
                <th>Fixed Costs</th>
                <th>vs. Min</th>
              </tr>
            </thead>
            <tbody>
              {forecastData.map(row => {
                const isWarn = row.week === 5 || row.week === 6;
                const aboveMin = row.projected - row.minimum;
                return (
                  <tr key={row.week} class={isWarn ? 'warn-week' : ''}>
                    <td>{row.label}</td>
                    <td class={isWarn ? 'warn-cell' : 'projected-cell'}>{fmtM(row.projected)}</td>
                    <td class="inflow">{row.arInflow > 0 ? `+${fmtK(row.arInflow)}` : '-'}</td>
                    <td class="outflow">{row.apOutflow > 0 ? `-${fmtK(row.apOutflow)}` : '-'}</td>
                    <td class="outflow">{row.poOutflow > 0 ? `-${fmtK(row.poOutflow)}` : '-'}</td>
                    <td class="outflow">{row.fixedCosts > 0 ? `-${fmtK(row.fixedCosts)}` : '-'}</td>
                    <td style={{ color: aboveMin > 1000000 ? 'var(--emerald)' : aboveMin > 500000 ? 'var(--amber)' : 'var(--rose)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                      +{fmtK(aboveMin)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
