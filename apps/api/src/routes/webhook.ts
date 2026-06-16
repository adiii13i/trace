import { Router } from 'express';
import { verifyGithubWebhook } from '../middleware/verifyWebhook';
import { handleGithubPush }    from '../controllers/webhookController';

const router = Router();

// The inline middleware buffers the raw request body as a Buffer.
// This MUST happen before verifyGithubWebhook, which needs the raw bytes
// to compute the HMAC. Do not add express.json() before this route.
router.post(
  '/github',
  (req, _res, next) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end',  () => { req.body = Buffer.concat(chunks); next(); });
  },
  verifyGithubWebhook,
  handleGithubPush
);

export default router;
