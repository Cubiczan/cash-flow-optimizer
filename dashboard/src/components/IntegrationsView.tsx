import { FunctionComponent } from 'preact';
import { integrations } from '../data';

const logoLabels: Record<string, string> = {
  xero: 'Xero',
  precoro: 'PC',
  outlook: 'OL',
  syft: 'Sy',
};

export const IntegrationsView: FunctionComponent = () => {
  return (
    <div class="view">
      <div class="view-header">
        <div>
          <h1>Integrations</h1>
          <p>4 platforms connected via Vellum API Nodes · OAuth 2.0 + API Keys · Composio managed auth</p>
        </div>
      </div>

      <div class="integrations-grid">
        {integrations.map(int => (
          <div key={int.id} class="int-card">
            <div class="int-header">
              <div class="int-name-wrap">
                <div class={`int-logo ${int.id}`}>{logoLabels[int.id]}</div>
                <div>
                  <div class="int-name">{int.name}</div>
                  <div class="int-last-sync">
                    {int.status === 'connected' ? `Last sync: ${int.lastSync}` : 'Not connected'}
                  </div>
                </div>
              </div>
              <span class={`int-status-pill ${int.status}`}>
                {int.status === 'connected' ? '● LIVE' : int.status === 'disconnected' ? '○ OFFLINE' : int.status.toUpperCase()}
              </span>
            </div>
            <div class="int-body">
              <div class="int-field">
                <span class="int-field-label">Data Points</span>
                <span class="int-field-value">{int.dataPoints}</span>
              </div>
              <div class="int-field">
                <span class="int-field-label">Auth Method</span>
                <span class="int-field-value">{int.authMethod}</span>
              </div>
              <div class="int-field">
                <span class="int-field-label">Endpoint</span>
                <span class="int-field-value mono">{int.endpoint}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Architecture note */}
      <div class="panel" style={{ marginTop: '14px' }}>
        <div class="panel-header">
          <span class="panel-title">Vellum Architecture</span>
        </div>
        <div style={{ padding: '16px 18px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
          {[
            {
              phase: 'Ingestion',
              color: 'var(--sky)',
              items: ['API Node: Xero OAuth pull', 'API Node: Precoro REST pull', 'Composio: Outlook email trigger', 'Code Node: token refresh logic'],
            },
            {
              phase: 'Processing',
              color: 'var(--emerald)',
              items: ['Code Node: normalize + schema', 'Code Node: 13-week cash model', 'Agent Node: LLM analysis', 'Guardrail Node: threshold checks'],
            },
            {
              phase: 'Output',
              color: '#a78bfa',
              items: ['Graph API: email to CFO', 'Search Node: RAG history', 'Map Node: per-risk actions', 'Webhook: dashboard JSON'],
            },
          ].map(col => (
            <div key={col.phase}>
              <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: col.color, marginBottom: '10px' }}>
                {col.phase}
              </div>
              {col.items.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '7px' }}>
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: col.color, flexShrink: 0, display: 'inline-block' }} />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{item}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
