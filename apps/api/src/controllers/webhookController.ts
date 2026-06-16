import { Request, Response } from 'express';
import { Task } from '../models/Task';
import { fetchCommitDiff } from '../services/gitService';
import { verifyTaskWithLLM } from '../services/llmService';

export async function handleGithubPush(req: Request, res: Response): Promise<void> {
  const event = req.headers['x-github-event'];

  if (event !== 'push') {
    res.status(200).json({ skipped: true });
    return;
  }

  const payload:      any    = (req as any).parsedPayload;
  const project:      any    = (req as any).project;
  const commits:      any[]  = payload?.commits ?? [];
  const pusherLogin:  string = payload?.pusher?.login ?? '';

  if (!pusherLogin || commits.length === 0) {
    res.status(200).json({ skipped: true });
    return;
  }

  // Respond 202 immediately — GitHub will retry if we don't respond
  // within 10 seconds, and LLM inference easily takes longer than that.
  res.status(202).json({ accepted: true });

  // Fire-and-forget — errors are logged but don't affect the 202
  processCommits({ project, pusherLogin, commits }).catch((err) =>
    console.error('[webhook]', err)
  );
}

async function processCommits({
  project,
  pusherLogin,
  commits,
}: {
  project:      any;
  pusherLogin:  string;
  commits:      any[];
}) {
  // Only look at tasks assigned to the person who pushed
  const allTasks = await Task.find({
    project: project._id,
    status:  { $in: ['in_progress', 'in_review'] },
  }).populate<{ assignedTo: { login: string } | null }>('assignedTo');

  const myTasks = allTasks.filter(
    (t) => (t.assignedTo as any)?.login === pusherLogin
  );

  if (myTasks.length === 0) return;

  for (const commit of commits) {
    const sha:     string = commit.id;
    const message: string = commit.message ?? '';

    let diff: string;
    try {
      diff = await fetchCommitDiff(project.repoOwner, project.repoName, sha);
    } catch (err) {
      console.error(`[webhook] failed to fetch diff for ${sha}:`, err);
      continue;
    }

    for (const task of myTasks) {
      try {
        const result = await verifyTaskWithLLM(
          task.title,
          task.description,
          task.acceptanceCriteria,
          message,
          diff
        );

        task.verificationHistory.push({
          commitSha:     sha,
          commitMessage: message,
          diffSnippet:   diff.slice(0, 4000),
          llmVerdict:    result.verified,
          llmReasoning:  result.reasoning,
          attemptedAt:   new Date(),
        });

        if (result.verified) {
          task.status            = 'verified';
          task.verifiedCommitSha = sha;
          task.verifiedAt        = new Date();
          task.earnedPoints      = task.estimatedPoints;
        }

        await task.save();
        console.log(`[webhook] task ${task._id} verified=${result.verified}`);
      } catch (err) {
        console.error(`[webhook] LLM error on task ${task._id}:`, err);
      }
    }
  }
}
