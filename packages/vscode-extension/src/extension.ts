import * as vscode from 'vscode';
import { TraceTaskProvider } from './taskProvider';

export function activate(context: vscode.ExtensionContext) {
  console.log('[trace] Context Bridge activated');

  const provider = new TraceTaskProvider();

  // Register tree view
  const treeView = vscode.window.createTreeView('trace.tasksView', {
    treeDataProvider: provider,
    showCollapseAll:  false,
  });

  // Register commands
  const fetchCmd = vscode.commands.registerCommand('trace.fetchTasks', async () => {
    await provider.loadTasks();
    vscode.window.showInformationMessage('trace: Tasks synced');
  });

  const openTaskCmd = vscode.commands.registerCommand('trace.openTask', (task: any) => {
    const panel = vscode.window.createWebviewPanel(
      'traceTask',
      task.title,
      vscode.ViewColumn.Beside,
      { enableScripts: false }
    );

    panel.webview.html = renderTaskHtml(task);
  });

  const setApiUrlCmd = vscode.commands.registerCommand('trace.setApiUrl', async () => {
    const url = await vscode.window.showInputBox({
      prompt:      'Enter trace API URL',
      placeHolder: 'http://localhost:4000',
      value:       vscode.workspace.getConfiguration('trace').get('apiUrl'),
    });
    if (url) {
      await vscode.workspace.getConfiguration('trace').update('apiUrl', url, true);
      vscode.window.showInformationMessage(`trace: API URL set to ${url}`);
    }
  });

  const setTokenCmd = vscode.commands.registerCommand('trace.setToken', async () => {
    const token = await vscode.window.showInputBox({
      prompt:   'Paste your trace JWT token (from Settings in the web app)',
      password: true,
    });
    if (token) {
      await vscode.workspace.getConfiguration('trace').update('token', token, true);
      vscode.window.showInformationMessage('trace: Token saved. Fetching tasks...');
      await provider.loadTasks();
    }
  });

  // Auto-load on activation
  provider.loadTasks();

  context.subscriptions.push(treeView, fetchCmd, openTaskCmd, setApiUrlCmd, setTokenCmd);
}

export function deactivate() {}

function renderTaskHtml(task: any): string {
  const criteria = (task.acceptanceCriteria ?? [])
    .map((c: string, i: number) => `<li>${i + 1}. ${escHtml(c)}</li>`)
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  body { font-family: 'IBM Plex Mono', monospace; background: #0a0a0a; color: #e8e8e8; padding: 20px; font-size: 12px; line-height: 1.6; }
  h2 { font-size: 14px; font-weight: 500; margin-bottom: 4px; color: #fff; }
  .meta { color: #666; font-size: 10px; margin-bottom: 16px; letter-spacing: 0.5px; }
  .badge { display: inline-block; border: 1px solid; padding: 1px 6px; font-size: 9px; letter-spacing: 0.5px; margin-right: 6px; }
  .critical { border-color: #ef4444; color: #f87171; }
  .high { border-color: #f59e0b; color: #fbbf24; }
  .medium { border-color: #60a5fa; color: #93c5fd; }
  .low { border-color: #555; color: #888; }
  .section-label { font-size: 9px; color: #555; letter-spacing: 1px; text-transform: uppercase; margin: 16px 0 8px; }
  p { color: #aaa; }
  ul { color: #aaa; padding-left: 0; list-style: none; }
  li { padding: 3px 0; border-bottom: 1px solid #1a1a1a; }
  .pts { color: #666; font-size: 10px; }
</style>
</head>
<body>
<h2>${escHtml(task.title)}</h2>
<div class="meta">
  <span class="badge ${escHtml(task.priority)}">${escHtml(task.priority.toUpperCase())}</span>
  <span class="badge">${escHtml(task.status.replace('_', ' ').toUpperCase())}</span>
  <span class="pts">${task.estimatedPoints ?? 0} pts · ${task.project?.repoName ?? '—'}</span>
</div>
<div class="section-label">Description</div>
<p>${escHtml(task.description)}</p>
${criteria ? `<div class="section-label">Acceptance Criteria</div><ul>${criteria}</ul>` : ''}
</body>
</html>`;
}

function escHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
