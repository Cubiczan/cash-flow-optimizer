import { Alert, KPIData, AgingEntry, ForecastPoint, Recommendation, Workflow, CommittedPO, Integration } from './types';

export const kpiData: KPIData = {
  cashPosition: 2347000,
  arTotal: 1824500,
  apTotal: 983200,
  committedPOs: 445800,
  netPosition: 2742500,
};

export const alerts: Alert[] = [
  {
    id: 'a1',
    level: 'warning',
    title: '$285,400 AR overdue >60 days across 3 accounts',
    detail: 'Enviro Systems ($142K), Pacific Renewables ($88K), Austral Energy ($55K) — immediate follow-up recommended',
  },
  {
    id: 'a2',
    level: 'info',
    title: 'Cash dip projected in weeks 5-6 (floor: ~$1.72M)',
    detail: 'Large AP batch due + 2 PO deliveries expected. Consider pre-approving credit facility drawdown.',
  },
];

export const arAging: AgingEntry[] = [
  { contact: 'Enviro Systems Pty Ltd', current: 0, days1_30: 48500, days31_60: 142000, days61_90: 0, days90plus: 0, total: 190500 },
  { contact: 'Pacific Renewables', current: 125000, days1_30: 0, days31_60: 88000, days61_90: 0, days90plus: 0, total: 213000 },
  { contact: 'Austral Energy Group', current: 78000, days1_30: 22000, days31_60: 0, days61_90: 55400, days90plus: 0, total: 155400 },
  { contact: 'CleanTech Industries', current: 340000, days1_30: 0, days31_60: 0, days61_90: 0, days90plus: 0, total: 340000 },
  { contact: 'Horizon Power WA', current: 198600, days1_30: 85000, days31_60: 0, days61_90: 0, days90plus: 0, total: 283600 },
  { contact: 'GreenFleet Solutions', current: 156000, days1_30: 0, days31_60: 0, days61_90: 0, days90plus: 0, total: 156000 },
  { contact: 'Other (12 accounts)', current: 312500, days1_30: 88000, days31_60: 55000, days61_90: 30500, days90plus: 0, total: 486000 },
];

export const apAging: AgingEntry[] = [
  { contact: 'Samsung SDI Co.', current: 280000, days1_30: 0, days31_60: 0, days61_90: 0, days90plus: 0, total: 280000 },
  { contact: 'Panasonic Energy', current: 0, days1_30: 180000, days31_60: 0, days61_90: 0, days90plus: 0, total: 180000 },
  { contact: 'Mitsubishi Materials', current: 145200, days1_30: 0, days31_60: 0, days61_90: 0, days90plus: 0, total: 145200 },
  { contact: 'BMS Technologies', current: 98000, days1_30: 45000, days31_60: 0, days61_90: 0, days90plus: 0, total: 143000 },
  { contact: 'Logistics & Freight', current: 52000, days1_30: 28500, days31_60: 12000, days61_90: 0, days90plus: 0, total: 92500 },
  { contact: 'Other (8 vendors)', current: 88500, days1_30: 54000, days31_60: 0, days61_90: 0, days90plus: 0, total: 142500 },
];

export const forecastData: ForecastPoint[] = [
  { week: 0, label: 'Now', projected: 2347000, minimum: 500000, arInflow: 0, apOutflow: 0, poOutflow: 0, fixedCosts: 0 },
  { week: 1, label: 'Wk 1', projected: 2185000, minimum: 500000, arInflow: 125000, apOutflow: 180000, poOutflow: 0, fixedCosts: 107000 },
  { week: 2, label: 'Wk 2', projected: 2456000, minimum: 500000, arInflow: 388000, apOutflow: 92000, poOutflow: 0, fixedCosts: 45000 },
  { week: 3, label: 'Wk 3', projected: 2612000, minimum: 500000, arInflow: 263000, apOutflow: 145200, poOutflow: 0, fixedCosts: 62000 },
  { week: 4, label: 'Wk 4', projected: 2380000, minimum: 500000, arInflow: 156000, apOutflow: 280000, poOutflow: 88000, fixedCosts: 100000 },
  { week: 5, label: 'Wk 5', projected: 1985000, minimum: 500000, arInflow: 85000, apOutflow: 328000, poOutflow: 0, fixedCosts: 152000 },
  { week: 6, label: 'Wk 6', projected: 1724000, minimum: 500000, arInflow: 142000, apOutflow: 255000, poOutflow: 0, fixedCosts: 148000 },
  { week: 7, label: 'Wk 7', projected: 2055000, minimum: 500000, arInflow: 448000, apOutflow: 98000, poOutflow: 0, fixedCosts: 19000 },
  { week: 8, label: 'Wk 8', projected: 2318000, minimum: 500000, arInflow: 340000, apOutflow: 45000, poOutflow: 0, fixedCosts: 32000 },
  { week: 9, label: 'Wk 9', projected: 2548000, minimum: 500000, arInflow: 312000, apOutflow: 82000, poOutflow: 0, fixedCosts: 0 },
  { week: 10, label: 'Wk 10', projected: 2415000, minimum: 500000, arInflow: 198000, apOutflow: 180000, poOutflow: 0, fixedCosts: 151000 },
  { week: 11, label: 'Wk 11', projected: 2680000, minimum: 500000, arInflow: 420000, apOutflow: 98000, poOutflow: 0, fixedCosts: 57000 },
  { week: 12, label: 'Wk 12', projected: 2856000, minimum: 500000, arInflow: 285000, apOutflow: 62000, poOutflow: 0, fixedCosts: 47000 },
  { week: 13, label: 'Wk 13', projected: 3012000, minimum: 500000, arInflow: 312000, apOutflow: 98000, poOutflow: 0, fixedCosts: 58000 },
];

export const recommendations: Recommendation[] = [
  {
    id: 'r1',
    priority: 'high',
    category: 'AR Collection',
    action: 'Escalate 60+ day AR: Enviro Systems ($142K), Pacific Renewables ($88K), Austral Energy ($55K)',
    impact: 'Recover $285,400 — improves weeks 5-6 cash floor by 16.6%',
    amount: 285400,
  },
  {
    id: 'r2',
    priority: 'high',
    category: 'AP Management',
    action: 'Negotiate 30-day extension on Panasonic Energy $180K due Week 5',
    impact: 'Prevents week 6 floor from falling below $1.7M',
    amount: 180000,
  },
  {
    id: 'r3',
    priority: 'medium',
    category: 'Credit Facility',
    action: 'Pre-approve $300K credit facility drawdown in Week 4 as liquidity buffer',
    impact: 'Maintains $500K minimum threshold through weeks 5-6 dip',
    amount: 300000,
  },
  {
    id: 'r4',
    priority: 'medium',
    category: 'Working Capital',
    action: 'Offer CleanTech Industries 2% early-pay discount on $340K balance',
    impact: 'Brings forward ~$333K cash — resolves weeks 5-6 risk entirely',
    amount: 333000,
  },
];

export const workflows: Workflow[] = [
  {
    id: 'wf1',
    name: 'Daily Cash Position',
    description: 'Pulls Xero bank data, AR/AP aging, and Precoro POs. Calculates net cash position and emails morning report.',
    trigger: 'Scheduled',
    schedule: 'Every day at 7:00 AM AEST',
    lastRun: 'Today, 7:02 AM',
    nextRun: 'Tomorrow, 7:00 AM',
    status: 'completed',
    steps: [
      { name: 'Xero: GET /BankTransactions (last 24h)', nodeType: 'API', status: 'completed', durationMs: 342 },
      { name: 'Xero: GET /Reports/AgedReceivablesByContact', nodeType: 'API', status: 'completed', durationMs: 518 },
      { name: 'Xero: GET /Reports/AgedPayablesByContact', nodeType: 'API', status: 'completed', durationMs: 411 },
      { name: 'Precoro: GET /purchaseorders?status=approved', nodeType: 'API', status: 'completed', durationMs: 287 },
      { name: 'Normalize data & calculate net position', nodeType: 'Code', status: 'completed', durationMs: 124 },
      { name: 'LLM: Cash analysis + recommendations', nodeType: 'Agent', status: 'completed', durationMs: 3840 },
      { name: 'Guardrail: threshold alert checks', nodeType: 'Guardrail', status: 'completed', durationMs: 18 },
      { name: 'Graph API: Send daily report email', nodeType: 'Output', status: 'completed', durationMs: 221 },
    ],
  },
  {
    id: 'wf2',
    name: 'Invoice Ingestion',
    description: 'Monitors Outlook for invoice emails. Extracts PDF data, matches to POs, posts to Xero AP, and sends confirmation.',
    trigger: 'Event-driven',
    schedule: 'Outlook email trigger (invoice keyword)',
    lastRun: 'Today, 11:47 AM',
    nextRun: 'On next invoice email',
    status: 'idle',
    steps: [
      { name: 'Composio: Outlook new email (invoice keyword)', nodeType: 'API', status: 'pending' },
      { name: 'Code: Extract PDF attachment bytes', nodeType: 'Code', status: 'pending' },
      { name: 'LLM: Parse invoice fields from PDF', nodeType: 'Agent', status: 'pending' },
      { name: 'Conditional: Has PO reference?', nodeType: 'Conditional', status: 'pending' },
      { name: 'Precoro: 3-way match (PO / Invoice / Receipt)', nodeType: 'API', status: 'pending' },
      { name: 'Xero: POST /Invoices (create AP entry)', nodeType: 'API', status: 'pending' },
      { name: 'Graph API: Reply confirmation to sender', nodeType: 'Output', status: 'pending' },
    ],
  },
  {
    id: 'wf3',
    name: 'Weekly Cash Flow Forecast',
    description: 'Builds 13-week rolling forecast from Xero balance sheet, AR/AP schedule, and Precoro POs. Emails CFO + Moelis team.',
    trigger: 'Scheduled',
    schedule: 'Every Monday at 6:00 AM AEST',
    lastRun: 'Mon 5 May, 6:03 AM',
    nextRun: 'Mon 12 May, 6:00 AM',
    status: 'completed',
    steps: [
      { name: 'Xero: Balance sheet + authorised invoices', nodeType: 'API', status: 'completed', durationMs: 892 },
      { name: 'Precoro: Approved PO schedule', nodeType: 'API', status: 'completed', durationMs: 334 },
      { name: 'Code: Build 13-week cash model', nodeType: 'Code', status: 'completed', durationMs: 412 },
      { name: 'Search: RAG query on historical patterns', nodeType: 'Search', status: 'completed', durationMs: 287 },
      { name: 'LLM: Narrative forecast + risk register', nodeType: 'Agent', status: 'completed', durationMs: 5240 },
      { name: 'Map: Generate action items per risk', nodeType: 'Map', status: 'completed', durationMs: 1840 },
      { name: 'Graph API: Email to CFO + Moelis team', nodeType: 'Output', status: 'completed', durationMs: 318 },
    ],
  },
];

export const committedPOs: CommittedPO[] = [
  { id: 'po1', vendor: 'Samsung SDI Co.', amount: 185000, poNumber: 'PO-2026-0312', expectedDate: 'Wk 4', status: 'ordered', category: 'Battery Cells' },
  { id: 'po2', vendor: 'Mitsubishi Materials', amount: 98000, poNumber: 'PO-2026-0318', expectedDate: 'Wk 5', status: 'ordered', category: 'Electrode Materials' },
  { id: 'po3', vendor: 'BMS Technologies', amount: 72000, poNumber: 'PO-2026-0324', expectedDate: 'Wk 3', status: 'partial', category: 'BMS Hardware' },
  { id: 'po4', vendor: 'Precision Packaging', amount: 54800, poNumber: 'PO-2026-0331', expectedDate: 'Wk 6', status: 'approved', category: 'Packaging' },
  { id: 'po5', vendor: 'Clean Energy Logistics', amount: 36000, poNumber: 'PO-2026-0335', expectedDate: 'Wk 4', status: 'approved', category: 'Freight' },
];

export const integrations: Integration[] = [
  {
    id: 'xero',
    name: 'Xero',
    status: 'connected',
    lastSync: '2m ago',
    dataPoints: 'Bank transactions · AR/AP aging · Invoices · Balance sheet · P&L',
    authMethod: 'OAuth 2.0 (auto-refresh every 30 min)',
    endpoint: 'api.xero.com/api.xro/2.0',
  },
  {
    id: 'precoro',
    name: 'Precoro',
    status: 'connected',
    lastSync: '8m ago',
    dataPoints: 'Purchase orders · Receipts · Approved spend · Supplier data',
    authMethod: 'API Key (X-AUTH-KEY header)',
    endpoint: 'api.precoro.com/v1',
  },
  {
    id: 'outlook',
    name: 'Outlook / MS Graph',
    status: 'connected',
    lastSync: '1m ago',
    dataPoints: 'Invoice emails · PDF attachments · Calendar events · Send mail',
    authMethod: 'OAuth 2.0 via Composio (250+ apps)',
    endpoint: 'graph.microsoft.com/v1.0',
  },
  {
    id: 'syft',
    name: 'Syft Analytics',
    status: 'disconnected',
    lastSync: 'N/A',
    dataPoints: 'Logic replicated in Vellum Agent Node (no public API available)',
    authMethod: 'N/A — UI-only platform',
    endpoint: 'N/A',
  },
];
