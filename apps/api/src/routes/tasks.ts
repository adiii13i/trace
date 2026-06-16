import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getMyTasks, updateTaskStatus, getMetrics } from '../controllers/taskController';

const router = Router();

router.use(requireAuth);

router.get('/mine',         getMyTasks);
router.get('/metrics/me',   getMetrics);
router.patch('/:id/status', updateTaskStatus);

export default router;
