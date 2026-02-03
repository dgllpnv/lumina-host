import { Router } from 'express';
import {
  listTablesRooms,
  getTableRoom,
  createTableRoom,
  updateTableRoom,
  deleteTableRoom,
  updateTableRoomStatus,
} from '../controllers/tables-rooms.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { orgFilterMiddleware } from '../middleware/orgFilter.js';
import { requireStaff, requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/', authMiddleware, orgFilterMiddleware, requireStaff, listTablesRooms);
router.get('/:id', authMiddleware, orgFilterMiddleware, requireStaff, getTableRoom);
router.post('/', authMiddleware, orgFilterMiddleware, requireAdmin, createTableRoom);
router.put('/:id', authMiddleware, orgFilterMiddleware, requireAdmin, updateTableRoom);
router.patch('/:id/status', authMiddleware, orgFilterMiddleware, requireStaff, updateTableRoomStatus);
router.delete('/:id', authMiddleware, orgFilterMiddleware, requireAdmin, deleteTableRoom);

export default router;
