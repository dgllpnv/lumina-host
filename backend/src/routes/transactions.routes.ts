import { Router } from 'express';
import {
  listTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../controllers/transactions.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { orgFilterMiddleware } from '../middleware/orgFilter.js';
import { requireStaff, requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/', authMiddleware, orgFilterMiddleware, requireStaff, listTransactions);
router.get('/:id', authMiddleware, orgFilterMiddleware, requireStaff, getTransaction);
router.post('/', authMiddleware, orgFilterMiddleware, requireStaff, createTransaction);
router.put('/:id', authMiddleware, orgFilterMiddleware, requireStaff, updateTransaction);
router.delete('/:id', authMiddleware, orgFilterMiddleware, requireAdmin, deleteTransaction);

export default router;
