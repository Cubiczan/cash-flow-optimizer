import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { forecastData } from '../data';

interface Props {
  compact?: boolean;
}

const W = 800;
const PADDING = { top: 20, right: 16, bottom: 36, left: 62 };

const WORKING_CAP = 1_500_000;
const CRITICAL = 500_000;
const MAX_Y = 3_600_000;
const MIN_Y = 0;

const scaleX = (week: number, total: number, w: number) => {
  const plotW = w - PADDING.left - PADDING.right;
  return PADDING.left + (week / (total - 1)) * plotW;
};

const scaleY = (val: number, h: number) => {
  const plotH = h - PADDING.top - PADDING.bottom;
  return PADDING.top + plotH - ((val - MIN_Y) / (MAX_Y - MIN_Y)) * plotH;
};

const fmt = (val: number) => {
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(1)}M`;
  if (val >= 1000) return `$${(val / 1000).toFixed(0)}K`;
  return `$${val}`;
};

export const ForecastChart: FunctionComponent<Props> = ({ compact }) => {
  const [tooltip, setTooltip] = useState<{ x: number; y: number; week: number } | null>(null);
  const H = compact ? 210 : 300;
  const n = forecastData.length;

  // Build line path
  const points = forecastData.map((d, i) => ({
    cx: scaleX(i, n, W),
    cy: scaleY(d.projected, H),
    d: d,
    i,
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.cx.toFixed(1)},${p.cy.toFixed(1)}`).join(' ');
  const fillPath = `${linePath} L${points[n - 1].cx.toFixed(1)},${scaleY(0, H)} L${points[0].cx.toFixed(1)},${scaleY(0, H)} Z`;

  // Threshold lines
  const wcY = scaleY(WORKING_CAP, H);
  const crY = scaleY(CRITICAL, H);
  const plotLeft = PADDING.left;
  const plotRight = W - PADDING.right;

  // Y-axis ticks
  const yTicks = [0, 500000, 1000000, 1500000, 2000000, 2500000, 3000000, 3500000];

  const tooltipPoint = tooltip !== null ? points[tooltip.week] : null;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        style={{ width: '100%', height: compact ? '210px' : '300px', display: 'block' }}
        onMouseLeave={() => setTooltip(null)}
      >
        {/* Grid lines */}
        {yTicks.map(tick => {
          const y = scaleY(tick, H);
          if (y < PADDING.top || y > H - PADDING.bottom) return null;
          return (
            <g key={tick}>
              <line x1={plotLeft} y1={y} x2={plotRight} y2={y} stroke="rgba(30,51,88,0.6)" stroke-width="1" />
              <text x={plotLeft - 6} y={y + 4} text-anchor="end" font-size="9" fill="#3d5a7a" font-family="monospace">
                {fmt(tick)}
              </text>
            </g>
          );
        })}

        {/* Working capital threshold */}
        <line x1={plotLeft} y1={wcY} x2={plotRight} y2={wcY} stroke="rgba(245,166,35,0.45)" stroke-width="1.5" stroke-dasharray="6,4" />
        {!compact && <text x={plotRight + 4} y={wcY + 4} font-size="8" fill="#f5a623" font-family="monospace">$1.5M</text>}

        {/* Critical threshold */}
        <line x1={plotLeft} y1={crY} x2={plotRight} y2={crY} stroke="rgba(244,63,94,0.35)" stroke-width="1" stroke-dasharray="3,4" />
        {!compact && <text x={plotRight + 4} y={crY + 4} font-size="8" fill="#f43f5e" font-family="monospace">$500K</text>}

        {/* Warn zone shade (wk5-6) */}
        {(() => {
          const x5 = scaleX(5, n, W);
          const x6 = scaleX(6, n, W);
          const dx = (scaleX(1, n, W) - scaleX(0, n, W));
          return (
            <rect
              x={x5 - dx / 2}
              y={PADDING.top}
              width={x6 - x5 + dx}
              height={H - PADDING.top - PADDING.bottom}
              fill="rgba(245,166,35,0.05)"
            />
          );
        })()}

        {/* Fill area */}
        <path d={fillPath} fill="url(#emeraldGrad)" />

        {/* Gradient def */}
        <defs>
          <linearGradient id="emeraldGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#00c885" stop-opacity="0.2" />
            <stop offset="100%" stop-color="#00c885" stop-opacity="0.01" />
          </linearGradient>
        </defs>

        {/* Line */}
        <path d={linePath} fill="none" stroke="#00c885" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round" />

        {/* X-axis labels */}
        {points.map((p, i) => {
          if (compact && i % 2 !== 0 && i !== n - 1) return null;
          return (
            <text key={i} x={p.cx} y={H - 6} text-anchor="middle" font-size="9" fill="#3d5a7a" font-family="monospace">
              {forecastData[i].label}
            </text>
          );
        })}

        {/* Data points + hover targets */}
        {points.map((p, i) => {
          const isWarn = i === 5 || i === 6;
          const color = isWarn ? '#f5a623' : '#00c885';
          return (
            <g key={i}>
              <circle
                cx={p.cx}
                cy={p.cy}
                r={compact ? 3.5 : 4.5}
                fill={color}
                stroke="var(--navy-900, #0a1628)"
                stroke-width="1.5"
              />
              {/* Invisible hover area */}
              <rect
                x={p.cx - 16}
                y={PADDING.top}
                width={32}
                height={H - PADDING.top - PADDING.bottom}
                fill="transparent"
                style="cursor:crosshair"
                onMouseEnter={() => setTooltip({ x: p.cx, y: p.cy, week: i })}
              />
            </g>
          );
        })}

        {/* Tooltip */}
        {tooltipPoint && tooltip !== null && (() => {
          const d = forecastData[tooltip.week];
          const isWarn = tooltip.week === 5 || tooltip.week === 6;
          const tx = Math.min(tooltipPoint.cx + 10, W - 130);
          const ty = Math.max(PADDING.top + 5, tooltipPoint.cy - 60);
          return (
            <g>
              <line x1={tooltipPoint.cx} y1={PADDING.top} x2={tooltipPoint.cx} y2={H - PADDING.bottom} stroke="rgba(255,255,255,0.08)" stroke-width="1" stroke-dasharray="3,3" />
              <rect x={tx} y={ty} width={120} height={compact ? 40 : 68} rx="5" fill="rgba(10,22,40,0.96)" stroke="rgba(30,51,88,0.9)" stroke-width="1" />
              <text x={tx + 8} y={ty + 14} font-size="10" font-weight="700" fill={isWarn ? '#f5a623' : '#dce9ff'} font-family="monospace">{d.label}</text>
              <text x={tx + 8} y={ty + 27} font-size="11" font-weight="700" fill={isWarn ? '#f5a623' : '#00c885'} font-family="monospace">{fmt(d.projected)}</text>
              {!compact && (
                <>
                  <text x={tx + 8} y={ty + 42} font-size="9" fill="#3d8c60" font-family="monospace">+AR: {d.arInflow > 0 ? fmt(d.arInflow) : '—'}</text>
                  <text x={tx + 8} y={ty + 54} font-size="9" fill="#8b3a4a" font-family="monospace">-AP: {d.apOutflow > 0 ? fmt(d.apOutflow) : '—'}</text>
                  <text x={tx + 8} y={ty + 66} font-size="9" fill="#5a6a80" font-family="monospace">Fixed: {d.fixedCosts > 0 ? fmt(d.fixedCosts) : '—'}</text>
                </>
              )}
            </g>
          );
        })()}
      </svg>

      {!compact && (
        <div style={{ display: 'flex', gap: '16px', padding: '4px 16px 12px', justifyContent: 'center' }}>
          {[
            { color: '#00c885', label: 'Projected Cash' },
            { color: '#f5a623', dashed: true, label: 'Working Capital Min' },
            { color: '#f43f5e', dashed: true, label: 'Critical Threshold' },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <svg width="20" height="10">
                <line x1="0" y1="5" x2="20" y2="5" stroke={item.color} stroke-width="2" stroke-dasharray={item.dashed ? '4,3' : 'none'} />
              </svg>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
