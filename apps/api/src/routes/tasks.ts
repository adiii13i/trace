import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  getMyTasks,
  updateTaskStatus,
  getMetrics,
  getVerificationLogs,
} from '../controllers/taskController';

const router = Router();

router.use(requireAuth);

router.get('/mine',         getMyTasks);
router.get('/metrics/me',   getMetrics);
router.get('/logs',         getVerificationLogs);
router.patch('/:id/status', updateTaskStatus);

export default router;