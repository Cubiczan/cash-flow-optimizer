import { FunctionComponent } from 'preact';
import { kpiData, alerts, arAging, apAging, recommendations, committedPOs } from '../data';
import { ForecastChart } from './ForecastChart';
import { AgingTable } from './AgingTable';

const fmtM = (n: number) => `$${(n / 1000000).toFixed(3)}M`;
const fmtK = (n: number) => n >= 1000000 ? `$${(n / 1000000).toFixed(2)}M` : `$${(n / 1000).toFixed(0)}K`;

const alertIcons: Record<string, string> = { critical: '🔴', warning: '⚠', info: 'ℹ' };
const priorityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export const DashboardView: FunctionComponent = () => {
  return (
    <div class="view">
      {/* Header */}
      <div class="view-header">
        <div>
          <h1>Cash Position</h1>
          <p>Friday, 8 May 2026 · Cubiczan · Powered by Vellum · Xero synced 2m ago</p>
        </div>
        <button class="btn-sync">↻ Sync Now</button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div class="alerts-stack">
          {alerts.map(a => (
            <div key={a.id} class={`alert-banner ${a.level}`}>
              <span class="alert-icon">{alertIcons[a.level]}</span>
              <div>
                <div class="alert-title">{a.title}</div>
                <div class="alert-detail">{a.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* KPI Row */}
      <div class="kpi-grid">
        <div class="kpi-card accent">
          <div class="kpi-label">Current Cash</div>
          <div class="kpi-value emerald">{fmtM(kpiData.cashPosition)}</div>
          <div class="kpi-sub">Bank balance · Xero verified</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Accounts Receivable</div>
          <div class="kpi-value">{fmtM(kpiData.arTotal)}</div>
          <div class="kpi-sub">$285K overdue &gt;60 days</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-label">Accounts Payable</div>
          <div class="kpi-value amber">{fmtM(kpiData.apTotal)}</div>
          <div class="kpi-sub">$180K due in 30 days</div>
        </div>
        <div class="kpi-card warn">
          <div class="kpi-label">Committed POs</div>
          <div class="kpi-value amber">{fmtM(kpiData.committedPOs)}</div>
          <div class="kpi-sub">5 open orders · Precoro</div>
        </div>
        <div class="kpi-card accent">
          <div class="kpi-label">Net Position</div>
          <div class="kpi-value emerald">{fmtM(kpiData.netPosition)}</div>
          <div class="kpi-sub">Cash + AR - AP - POs</div>
        </div>
      </div>

      {/* Chart + Recommendations */}
      <div class="dash-mid">
        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">13-Week Cash Forecast</span>
            <span class="panel-badge amber">⚠ Wk 5-6 dip</span>
          </div>
          <ForecastChart compact />
        </div>

        <div class="panel">
          <div class="panel-header">
            <span class="panel-title">AI Recommendations</span>
            <span class="panel-badge emerald">{recommendations.length} actions</span>
          </div>
          <div class="recs-list">
            {[...recommendations].sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]).map(r => (
              <div key={r.id} class="rec-item">
                <div class="rec-header">
                  <span class={`priority-dot ${r.priority}`} />
                  <span class="rec-category">{r.category}</span>
                  {r.amount && <span class="rec-amount">{fmtK(r.amount)}</span>}
                </div>
                <div class="rec-action">{r.action}</div>
                <div class="rec-impact">{r.impact}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Aging Tables */}
      <div class="dash-aging">
        <AgingTable data={arAging} title="AR Aging" type="ar" />
        <AgingTable data={apAging} title="AP Aging" type="ap" />
      </div>

      {/* Committed POs */}
      <div class="panel">
        <div class="panel-header">
          <span class="panel-title">Committed Purchase Orders</span>
          <span class="panel-badge amber">${(committedPOs.reduce((s, p) => s + p.amount, 0) / 1000).toFixed(0)}K total committed</span>
        </div>
        <div class="po-grid">
          {committedPOs.map(po => (
            <div key={po.id} class="po-card">
              <div class="po-vendor">{po.vendor}</div>
              <div class="po-category">{po.category} · {po.poNumber}</div>
              <div class="po-amount">{fmtK(po.amount)}</div>
              <div class="po-footer">
                <span class="po-week">Due {po.expectedDate}</span>
                <span class={`po-status ${po.status}`}>{po.status}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
