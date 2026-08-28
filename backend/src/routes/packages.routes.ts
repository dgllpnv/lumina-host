import { Router } from 'express';
import { listPackages, createPackage, updatePackage, deletePackage } from '../controllers/packages.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { orgFilterMiddleware } from '../middleware/orgFilter.js';
import { requireStaff, requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/', authMiddleware, orgFilterMiddleware, requireStaff, listPackages);
router.post('/', authMiddleware, orgFilterMiddleware, requireAdmin, createPackage);
router.put('/:id', authMiddleware, orgFilterMiddleware, requireAdmin, updatePackage);
router.delete('/:id', authMiddleware, orgFilterMiddleware, requireAdmin, deletePackage);

export default router;
