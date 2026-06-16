import { Request, Response } from 'express';
import crypto from 'crypto';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { generateTasksFromPrompt } from '../services/llmService';

export async function createProject(req: Request, res: Response): Promise<void> {
  try {
    const { name, description, repoUrl, prompt, teamMemberIds } = req.body;
    const userId = (req as any).userId;

    if (!name || !repoUrl || !prompt) {
      res.status(400).json({ error: 'name, repoUrl, and prompt are required' });
      return;
    }

    const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?$/);
    if (!match) {
      res.status(400).json({ error: 'Invalid GitHub repo URL' });
      return;
    }
    const [, repoOwner, repoName] = match;
    const webhookSecret = crypto.randomBytes(32).toString('hex');

    const project = await Project.create({
      name,
      description: description ?? '',
      repoUrl,
      repoOwner,
      repoName,
      createdBy: userId,
      team: teamMemberIds ?? [],
      webhookSecret,
    });

    // Generate tasks via LLM
    const rawTasks = await generateTasksFromPrompt(name, prompt, repoUrl);

    const taskDocs = await Task.insertMany(
      rawTasks.map((t) => ({
        project: project._id,
        title: t.title,
        description: t.description,
        acceptanceCriteria: t.acceptanceCriteria,
        priority: t.priority,
        estimatedPoints: t.estimatedPoints,
      }))
    );

    project.tasks = taskDocs.map((t) => t._id as any);
    await project.save();

    res.status(201).json({ project, tasks: taskDocs });
  } catch (err) {
    console.error('[project] create error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProjects(req: Request, res: Response): Promise<void> {
  try {
    const userId = (req as any).userId;
    const projects = await Project.find({
      $or: [{ createdBy: userId }, { team: userId }],
    })
      .populate('team', 'login email avatarUrl role')
      .populate('createdBy', 'login email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProjectById(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;
    const project = await Project.findById(id)
      .populate('team', 'login email avatarUrl role')
      .populate('tasks');

    if (!project) { res.status(404).json({ error: 'Not found' }); return; }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}
