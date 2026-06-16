import * as vscode from 'vscode';

function getConfig() {
  const cfg = vscode.workspace.getConfiguration('trace');
  return {
    apiUrl: cfg.get<string>('apiUrl') ?? 'http://localhost:4000',
    token:  cfg.get<string>('token')  ?? '',
  };
}

export async function fetchMyTasks(): Promise<any[]> {
  const { apiUrl, token } = getConfig();
  if (!token) throw new Error('trace: No auth token configured. Run "trace: Set Auth Token".');

  const res = await fetch(`${apiUrl}/api/tasks/mine`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) throw new Error('trace: Token invalid or expired. Re-authenticate.');
  if (!res.ok) throw new Error(`trace API error: ${res.status}`);

  return res.json();
}

export async function updateTaskStatus(taskId: string, status: string): Promise<void> {
  const { apiUrl, token } = getConfig();
  await fetch(`${apiUrl}/api/tasks/${taskId}/status`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });
}
