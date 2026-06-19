import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import {
  createProject,
  getProjects,
  getProjectById,
  addTeamMember,
  removeTeamMember,
} from '../controllers/projectController';
import { getProjectTasks, assignTask } from '../controllers/taskController';

const router = Router();

router.use(requireAuth);

router.get('/',                    getProjects);
router.post('/',                   createProject);
router.get('/:id',                 getProjectById);
router.get('/:projectId/tasks',    getProjectTasks);
router.patch('/tasks/:id/assign',  assignTask);
router.post('/:id/team',           addTeamMember);
router.delete('/:id/team/:userId', removeTeamMember);

export default router;