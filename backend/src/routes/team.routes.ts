import { Router } from 'express';
import {
  listTeamMembers,
  getTeamMember,
  updateTeamMember,
  deleteTeamMember,
} from '../controllers/team.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { orgFilterMiddleware } from '../middleware/orgFilter.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/', authMiddleware, orgFilterMiddleware, listTeamMembers);
router.get('/:id', authMiddleware, getTeamMember);
router.put('/:id', authMiddleware, requireAdmin, updateTeamMember);
router.delete('/:id', authMiddleware, requireAdmin, deleteTeamMember);

export default router;
