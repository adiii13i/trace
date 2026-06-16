import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes    from './routes/auth';
import projectRoutes from './routes/projects';
import taskRoutes    from './routes/tasks';
import webhookRoutes from './routes/webhook';

const app  = express();
const PORT = process.env.PORT ?? 4000;

// ------------------------------------------------------------------
// CORS — only allow the frontend origin
// ------------------------------------------------------------------
app.use(
  cors({
    origin:      process.env.FRONTEND_URL ?? 'http://localhost:3000',
    credentials: true,
  })
);

// ------------------------------------------------------------------
// Webhook route MUST be mounted before express.json().
// GitHub sends a raw body that we need as a Buffer for HMAC
// verification. express.json() would consume it first and break that.
// ------------------------------------------------------------------
app.use('/api/webhooks', webhookRoutes);

// ------------------------------------------------------------------
// Standard JSON body parser for everything else
// ------------------------------------------------------------------
app.use(express.json());

// ------------------------------------------------------------------
// Routes
// ------------------------------------------------------------------
app.use('/api/auth',     authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks',    taskRoutes);

// Quick health check — useful for uptime monitors / deployment checks
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: Date.now() });
});

// ------------------------------------------------------------------
// Startup
// ------------------------------------------------------------------
async function main() {
  const uri = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/trace';

  try {
    await mongoose.connect(uri);
    console.log('[db] connected');
  } catch (err) {
    console.error('[db] connection failed:', err);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[api] http://localhost:${PORT}`);
  });
}

main();
