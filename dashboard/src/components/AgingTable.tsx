import { FunctionComponent } from 'preact';
import { AgingEntry } from '../types';

interface Props {
  data: AgingEntry[];
  title: string;
  type: 'ar' | 'ap';
}

const fmt = (n: number) => n === 0 ? '-' : `$${(n / 1000).toFixed(0)}K`;

export const AgingTable: FunctionComponent<Props> = ({ data, title, type }) => {
  const totals = data.reduce(
    (acc, row) => ({
      current: acc.current + row.current,
      days1_30: acc.days1_30 + row.days1_30,
      days31_60: acc.days31_60 + row.days31_60,
      days61_90: acc.days61_90 + row.days61_90,
      days90plus: acc.days90plus + row.days90plus,
      total: acc.total + row.total,
    }),
    { current: 0, days1_30: 0, days31_60: 0, days61_90: 0, days90plus: 0, total: 0 }
  );

  const overdue = totals.days31_60 + totals.days61_90 + totals.days90plus;
  const overduePercent = Math.round((overdue / totals.total) * 100);

  return (
    <div class="panel">
      <div class="panel-header">
        <span class="panel-title">{title}</span>
        <span class={`panel-badge ${overduePercent > 20 ? 'amber' : 'emerald'}`}>
          {overduePercent}% overdue
        </span>
      </div>
      <div style={{ overflowX: 'auto' }}>
        <table class="aging-table">
          <thead>
            <tr>
              <th>Contact</th>
              <th>Current</th>
              <th>1-30d</th>
              <th>31-60d</th>
              <th>61-90d</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.map(row => (
              <tr key={row.contact}>
                <td title={row.contact}>{row.contact}</td>
                <td class={row.current > 0 ? 'cell-current' : 'cell-zero'}>{fmt(row.current)}</td>
                <td class={row.days1_30 > 0 ? 'cell-30' : 'cell-zero'}>{fmt(row.days1_30)}</td>
                <td class={row.days31_60 > 0 ? 'cell-60' : 'cell-zero'}>{fmt(row.days31_60)}</td>
                <td class={row.days61_90 > 0 ? 'cell-90' : 'cell-zero'}>{fmt(row.days61_90)}</td>
                <td style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{fmt(row.total)}</td>
              </tr>
            ))}
            <tr class="aging-total-row">
              <td>TOTAL</td>
              <td>{fmt(totals.current)}</td>
              <td>{fmt(totals.days1_30)}</td>
              <td class={totals.days31_60 > 0 ? 'cell-60' : ''}>{fmt(totals.days31_60)}</td>
              <td class={totals.days61_90 > 0 ? 'cell-90' : ''}>{fmt(totals.days61_90)}</td>
              <td>{fmt(totals.total)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};
