import { Router } from 'express';
import { getRoomContent, upsertRoomContent } from '../controllers/room-content.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { orgFilterMiddleware } from '../middleware/orgFilter.js';
import { requireStaff, requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/:tableRoomId', authMiddleware, orgFilterMiddleware, requireStaff, getRoomContent);
router.put('/:tableRoomId', authMiddleware, orgFilterMiddleware, requireAdmin, upsertRoomContent);

export default router;
