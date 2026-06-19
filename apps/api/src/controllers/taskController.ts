import { Request, Response } from 'express';
import { Task } from '../models/Task';
import { Project } from '../models/Project';

export async function getMyTasks(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;

    const tasks = await Task.find({
      assignedTo: userId,
      status:     { $ne: 'verified' },
    })
      .populate('project', 'name repoName repoOwner')
      .sort({ priority: 1, createdAt: 1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProjectTasks(req: Request, res: Response): Promise<void> {
  try {
    const tasks = await Task.find({ project: req.params.projectId })
      .populate('assignedTo', 'login email avatarUrl')
      .sort({ priority: 1, status: 1 });

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function assignTask(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      {
        assignedTo: userId ?? null,
        status:     userId ? 'in_progress' : 'pending',
      },
      { new: true }
    ).populate('assignedTo', 'login email');

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function updateTaskStatus(req: Request, res: Response): Promise<void> {
  try {
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getMetrics(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;
    const tasks  = await Task.find({ assignedTo: userId });
    const points = tasks.reduce((sum, t) => sum + (t.earnedPoints ?? 0), 0);

    res.json({
      buildSha: '—',
      buildAge: '—',
      latency:  '—',
      region:   '—',
      points,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// GET /api/tasks/logs
// Flattens verificationHistory across every task in every project the
// current user can see, sorted newest first. Powers the Logs page.
export async function getVerificationLogs(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;

    const projects = await Project.find({
      $or: [{ createdBy: userId }, { team: userId }],
    }).select('_id name');

    const projectIds = projects.map((p) => p._id);
    const projectNameById = new Map(projects.map((p) => [String(p._id), p.name]));

    const tasks = await Task.find({
      project: { $in: projectIds },
      'verificationHistory.0': { $exists: true },
    }).select('title project verificationHistory');

    const entries = tasks.flatMap((t) =>
      t.verificationHistory.map((v) => ({
        taskId:        t._id,
        taskTitle:     t.title,
        projectName:   projectNameById.get(String(t.project)) ?? 'Unknown',
        commitSha:     v.commitSha,
        commitMessage: v.commitMessage,
        llmVerdict:    v.llmVerdict,
        llmReasoning:  v.llmReasoning,
        attemptedAt:   v.attemptedAt,
      }))
    );

    entries.sort((a, b) => new Date(b.attemptedAt).getTime() - new Date(a.attemptedAt).getTime());

    res.json(entries.slice(0, 100));
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
