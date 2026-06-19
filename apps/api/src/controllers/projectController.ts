import { Request, Response } from 'express';
import crypto from 'crypto';
import { Project } from '../models/Project';
import { Task } from '../models/Task';
import { User } from '../models/User';
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
      team:      teamMemberIds ?? [],
      webhookSecret,
    });

    const rawTasks = await generateTasksFromPrompt(name, prompt, repoUrl);

    const taskDocs = await Task.insertMany(
      rawTasks.map((t) => ({
        project:            project._id,
        title:              t.title,
        description:        t.description,
        acceptanceCriteria: t.acceptanceCriteria,
        priority:           t.priority,
        estimatedPoints:    t.estimatedPoints,
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
      .populate('team',      'login email avatarUrl role')
      .populate('createdBy', 'login email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

export async function getProjectById(req: Request, res: Response): Promise<void> {
  try {
    const project = await Project.findById(req.params.id)
      .populate('team',  'login email avatarUrl role')
      .populate('tasks');

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// POST /api/projects/:id/team
// Adds an existing user to a project's team by email.
// The person must have signed into trace at least once via GitHub OAuth
// so there's a User document to reference.
export async function addTeamMember(req: Request, res: Response): Promise<void> {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ error: 'email is required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      res.status(404).json({
        error: 'No user found with that email. They need to sign in to trace at least once first.',
      });
      return;
    }

    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { $addToSet: { team: user._id } }, // $addToSet prevents duplicates
      { new: true }
    ).populate('team', 'login email avatarUrl role');

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ team: project.team });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}

// DELETE /api/projects/:id/team/:userId
export async function removeTeamMember(req: Request, res: Response): Promise<void> {
  try {
    const { id, userId } = req.params;

    const project = await Project.findByIdAndUpdate(
      id,
      { $pull: { team: userId } },
      { new: true }
    ).populate('team', 'login email avatarUrl role');

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ team: project.team });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
}