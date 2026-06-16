import * as vscode from 'vscode';
import { fetchMyTasks } from './api';

type TaskStatus = 'pending' | 'in_progress' | 'in_review' | 'verified' | 'blocked';
type TaskPriority = 'critical' | 'high' | 'medium' | 'low';

const STATUS_ICON: Record<TaskStatus, string> = {
  pending:     '$(circle-outline)',
  in_progress: '$(sync~spin)',
  in_review:   '$(eye)',
  verified:    '$(check)',
  blocked:     '$(error)',
};

const PRIORITY_ICON: Record<TaskPriority, string> = {
  critical: '$(flame)',
  high:     '$(arrow-up)',
  medium:   '$(dash)',
  low:      '$(arrow-down)',
};

export class TaskItem extends vscode.TreeItem {
  constructor(
    public readonly task: any,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState
  ) {
    super(task.title, collapsibleState);
    this.tooltip       = task.description ?? task.title;
    this.description   = `${task.project?.repoName ?? '—'} · ${task.estimatedPoints}pts`;
    this.iconPath      = new vscode.ThemeIcon(
      STATUS_ICON[task.status as TaskStatus]?.replace(/\$\(|\)/g, '') ?? 'circle-outline'
    );
    this.contextValue  = 'traceTask';
    this.command = {
      command:   'trace.openTask',
      title:     'Open Task',
      arguments: [task],
    };
  }
}

export class TraceTaskProvider implements vscode.TreeDataProvider<TaskItem> {
  private _onDidChangeTreeData = new vscode.EventEmitter<TaskItem | undefined | null | void>();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private tasks: any[] = [];

  refresh(): void {
    this._onDidChangeTreeData.fire();
  }

  async loadTasks(): Promise<void> {
    try {
      this.tasks = await fetchMyTasks();
      this.refresh();
    } catch (err: any) {
      vscode.window.showErrorMessage(err.message ?? 'Failed to load tasks');
    }
  }

  getTreeItem(element: TaskItem): vscode.TreeItem {
    return element;
  }

  getChildren(): TaskItem[] {
    if (this.tasks.length === 0) {
      return [];
    }
    // Sort: critical first, then by status
    const sorted = [...this.tasks].sort((a, b) => {
      const priorities = ['critical', 'high', 'medium', 'low'];
      return priorities.indexOf(a.priority) - priorities.indexOf(b.priority);
    });
    return sorted.map((t) => new TaskItem(t, vscode.TreeItemCollapsibleState.None));
  }
}
