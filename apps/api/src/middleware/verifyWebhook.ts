import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { Project } from '../models/Project';

// GitHub signs every webhook payload with HMAC-SHA256 using the secret
// we set when creating the webhook. We verify this before touching the
// payload so we don't accidentally process spoofed requests.
//
// This middleware expects req.body to still be a raw Buffer —
// make sure the webhook route does NOT go through express.json() first.

export async function verifyGithubWebhook(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const signature = req.headers['x-hub-signature-256'] as string | undefined;

  if (!signature) {
    res.status(401).json({ error: 'Missing X-Hub-Signature-256' });
    return;
  }

  // At this point req.body is a raw Buffer
  const rawBody = req.body as Buffer;

  let parsed: any;
  try {
    parsed = JSON.parse(rawBody.toString('utf8'));
  } catch {
    res.status(400).json({ error: 'Invalid JSON in webhook payload' });
    return;
  }

  const repoOwner: string = parsed?.repository?.owner?.login ?? '';
  const repoName:  string = parsed?.repository?.name ?? '';

  // Find the project this push belongs to
  const project = await Project.findOne({ repoOwner, repoName, status: 'active' });

  if (!project) {
    // No matching project — respond 200 so GitHub doesn't keep retrying
    res.status(200).json({ skipped: true, reason: 'No active project for this repo' });
    return;
  }

  // Constant-time comparison to prevent timing attacks
  const expected = `sha256=${crypto
    .createHmac('sha256', project.webhookSecret)
    .update(rawBody)
    .digest('hex')}`;

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(401).json({ error: 'Signature mismatch' });
    return;
  }

  // Attach the parsed payload and project so the controller doesn't
  // have to re-parse or re-query
  (req as any).parsedPayload = parsed;
  (req as any).project       = project;
  next();
}
