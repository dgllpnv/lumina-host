import { Router } from 'express';
import {
  listOrganizations,
  getOrganization,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from '../controllers/organizations.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { requireSuperAdmin, requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/', authMiddleware, listOrganizations);
router.get('/:id', authMiddleware, getOrganization);
router.post('/', authMiddleware, requireSuperAdmin, createOrganization);
router.put('/:id', authMiddleware, requireAdmin, updateOrganization);
router.delete('/:id', authMiddleware, requireSuperAdmin, deleteOrganization);

export default router;
