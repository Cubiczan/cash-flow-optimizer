export type AlertLevel = 'critical' | 'warning' | 'info';
export type TabId = 'dashboard' | 'forecast' | 'workflows' | 'integrations';
export type WorkflowStatus = 'completed' | 'running' | 'failed' | 'idle';
export type StepStatus = 'completed' | 'running' | 'pending' | 'failed';
export type IntegrationStatus = 'connected' | 'disconnected' | 'syncing' | 'error';
export type Priority = 'critical' | 'high' | 'medium' | 'low';

export interface Alert {
  id: string;
  level: AlertLevel;
  title: string;
  detail: string;
}

export interface KPIData {
  cashPosition: number;
  arTotal: number;
  apTotal: number;
  committedPOs: number;
  netPosition: number;
}

export interface AgingEntry {
  contact: string;
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90plus: number;
  total: number;
}

export interface ForecastPoint {
  week: number;
  label: string;
  projected: number;
  minimum: number;
  arInflow: number;
  apOutflow: number;
  poOutflow: number;
  fixedCosts: number;
}

export interface Recommendation {
  id: string;
  priority: Priority;
  category: string;
  action: string;
  impact: string;
  amount?: number;
}

export interface WorkflowStep {
  name: string;
  nodeType: 'API' | 'Code' | 'Agent' | 'Conditional' | 'Guardrail' | 'Map' | 'Search' | 'Output';
  status: StepStatus;
  durationMs?: number;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  trigger: string;
  schedule: string;
  lastRun: string;
  nextRun: string;
  status: WorkflowStatus;
  steps: WorkflowStep[];
}

export interface CommittedPO {
  id: string;
  vendor: string;
  amount: number;
  poNumber: string;
  expectedDate: string;
  status: 'approved' | 'ordered' | 'partial';
  category: string;
}

export interface Integration {
  id: string;
  name: string;
  status: IntegrationStatus;
  lastSync: string;
  dataPoints: string;
  authMethod: string;
  endpoint: string;
}
