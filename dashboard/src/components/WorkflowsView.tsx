import { FunctionComponent } from 'preact';
import { useState } from 'preact/hooks';
import { workflows as initialWorkflows } from '../data';
import { Workflow, WorkflowStatus } from '../types';

const nodeTypeClass: Record<string, string> = {
  API: 'node-API',
  Code: 'node-Code',
  Agent: 'node-Agent',
  Conditional: 'node-Conditional',
  Guardrail: 'node-Guardrail',
  Map: 'node-Map',
  Search: 'node-Search',
  Output: 'node-Output',
};

const stepIconMap: Record<string, string> = {
  completed: '✓',
  running: '◌',
  pending: '○',
  failed: '✕',
};

const fmtDuration = (ms?: number) => {
  if (!ms) return '';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
};

const deepCloneWorkflows = (wfs: typeof initialWorkflows) =>
  wfs.map(w => ({ ...w, steps: w.steps.map(s => ({ ...s })) }));

export const WorkflowsView: FunctionComponent = () => {
  const [wfState, setWfState] = useState<Workflow[]>(deepCloneWorkflows(initialWorkflows));
  const [runningId, setRunningId] = useState<string | null>(null);

  const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

  const runWorkflow = async (id: string) => {
    if (runningId) return;
    setRunningId(id);

    // Reset steps to pending
    setWfState(prev =>
      prev.map(w =>
        w.id === id
          ? { ...w, status: 'running' as WorkflowStatus, steps: w.steps.map(s => ({ ...s, status: 'pending' as const })) }
          : w
      )
    );

    const wf = wfState.find(w => w.id === id)!;

    for (let i = 0; i < wf.steps.length; i++) {
      setWfState(prev =>
        prev.map(w =>
          w.id === id
            ? { ...w, steps: w.steps.map((s, idx) => idx === i ? { ...s, status: 'running' as const } : s) }
            : w
        )
      );
      const delay = 500 + Math.random() * 900;
      await sleep(delay);
      setWfState(prev =>
        prev.map(w =>
          w.id === id
            ? { ...w, steps: w.steps.map((s, idx) => idx === i ? { ...s, status: 'completed' as const } : s) }
            : w
        )
      );
    }

    setWfState(prev =>
      prev.map(w =>
        w.id === id ? { ...w, status: 'completed' as WorkflowStatus, lastRun: 'Just now' } : w
      )
    );
    setRunningId(null);
  };

  return (
    <div class="view">
      <div class="view-header">
        <div>
          <h1>Vellum Workflows</h1>
          <p>3 automated workflows · Xero · Precoro · Outlook · Powered by Vellum Engine</p>
        </div>
      </div>

      <div class="workflows-grid">
        {wfState.map(wf => {
          const isThisRunning = runningId === wf.id;
          const completedSteps = wf.steps.filter(s => s.status === 'completed').length;
          const totalSteps = wf.steps.length;

          return (
            <div key={wf.id} class="wf-card">
              <div class="wf-header">
                <div class="wf-meta">
                  <div class="wf-name">{wf.name}</div>
                  <div class="wf-desc">{wf.description}</div>
                </div>
                <span class={`wf-status-badge ${wf.status}`}>
                  {isThisRunning
                    ? `${completedSteps}/${totalSteps} steps`
                    : wf.status === 'idle' ? 'WAITING' : wf.status.toUpperCase()}
                </span>
              </div>

              <div class="wf-info-row">
                <div class="wf-info-item">
                  <span class="wf-info-label">Trigger</span>
                  <span class="wf-info-value">{wf.trigger}</span>
                </div>
                <div class="wf-info-item">
                  <span class="wf-info-label">Schedule</span>
                  <span class="wf-info-value">{wf.schedule}</span>
                </div>
                <div class="wf-info-item">
                  <span class="wf-info-label">Last Run</span>
                  <span class="wf-info-value">{wf.lastRun}</span>
                </div>
                <div class="wf-info-item">
                  <span class="wf-info-label">Next Run</span>
                  <span class="wf-info-value">{wf.nextRun}</span>
                </div>
              </div>

              <div class="wf-steps">
                {wf.steps.map((step, idx) => (
                  <div key={idx} class={`wf-step ${step.status}`}>
                    <div class={`step-icon ${step.status}`}>
                      {step.status === 'running' ? '◌' : stepIconMap[step.status]}
                    </div>
                    <span class={`step-name ${step.status === 'pending' ? 'pending' : ''}`}>
                      {step.name}
                    </span>
                    <span class={`step-node-type ${nodeTypeClass[step.nodeType]}`}>
                      {step.nodeType}
                    </span>
                    <span class="step-duration">
                      {step.status === 'running' ? '...' : fmtDuration(step.durationMs)}
                    </span>
                  </div>
                ))}
              </div>

              <div class="wf-footer">
                <button
                  class="btn-run"
                  onClick={() => runWorkflow(wf.id)}
                  disabled={!!runningId}
                >
                  {isThisRunning ? '⟳ Running...' : '▶ Run Simulation'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
