import { Router } from 'express';
import { listTips, createTip, updateTip, deleteTip } from '../controllers/tips.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { orgFilterMiddleware } from '../middleware/orgFilter.js';
import { requireStaff, requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/', authMiddleware, orgFilterMiddleware, requireStaff, listTips);
router.post('/', authMiddleware, orgFilterMiddleware, requireAdmin, createTip);
router.put('/:id', authMiddleware, orgFilterMiddleware, requireAdmin, updateTip);
router.delete('/:id', authMiddleware, orgFilterMiddleware, requireAdmin, deleteTip);

export default router;
