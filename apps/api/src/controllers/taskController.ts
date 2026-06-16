import { Request, Response } from 'express';
import { Task } from '../models/Task';

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
