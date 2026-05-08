import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { DashboardView } from './DashboardView';
import { ForecastView } from './ForecastView';
import { WorkflowsView } from './WorkflowsView';
import { IntegrationsView } from './IntegrationsView';
import { TabId } from '../types';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '⬡' },
  { id: 'forecast', label: '13-Week Forecast', icon: '◈' },
  { id: 'workflows', label: 'Workflows', icon: '⚙' },
  { id: 'integrations', label: 'Integrations', icon: '◎' },
];

export const App: FunctionComponent = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');

  return (
    <div class="app-shell">
      <aside class="sidebar">
        <div class="sidebar-brand">
          <div class="brand-bolt">⚡</div>
          <div>
            <div class="brand-name">Cubiczan</div>
            <div class="brand-sub">Cash Flow Optimizer</div>
          </div>
        </div>
        <nav class="sidebar-nav">
          {TABS.map(tab => (
            <button
              key={tab.id}
              class={`nav-item${activeTab === tab.id ? ' active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span class="nav-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
        <div class="sidebar-footer">
          <span class="sync-dot" />
          <span class="sync-label">Cubiczan · Xero synced 2m ago</span>
        </div>
      </aside>
      <main class="main-content">
        {activeTab === 'dashboard' && <DashboardView />}
        {activeTab === 'forecast' && <ForecastView />}
        {activeTab === 'workflows' && <WorkflowsView />}
        {activeTab === 'integrations' && <IntegrationsView />}
      </main>
    </div>
  );
};
