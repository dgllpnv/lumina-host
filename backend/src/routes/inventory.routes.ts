import { Router } from 'express';
import {
  listInventory,
  getInventoryItem,
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  adjustInventory,
} from '../controllers/inventory.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { orgFilterMiddleware } from '../middleware/orgFilter.js';
import { requireStaff, requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/', authMiddleware, orgFilterMiddleware, requireStaff, listInventory);
router.get('/:id', authMiddleware, orgFilterMiddleware, requireStaff, getInventoryItem);
router.post('/', authMiddleware, orgFilterMiddleware, requireAdmin, createInventoryItem);
router.put('/:id', authMiddleware, orgFilterMiddleware, requireStaff, updateInventoryItem);
router.post('/:id/adjust', authMiddleware, orgFilterMiddleware, requireStaff, adjustInventory);
router.delete('/:id', authMiddleware, orgFilterMiddleware, requireAdmin, deleteInventoryItem);

export default router;
