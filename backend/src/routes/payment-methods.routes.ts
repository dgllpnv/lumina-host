import { Router } from 'express';
import {
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
} from '../controllers/payment-methods.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { orgFilterMiddleware } from '../middleware/orgFilter.js';
import { requireStaff, requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/', authMiddleware, orgFilterMiddleware, requireStaff, listPaymentMethods);
router.post('/', authMiddleware, orgFilterMiddleware, requireAdmin, createPaymentMethod);
router.put('/:id', authMiddleware, orgFilterMiddleware, requireAdmin, updatePaymentMethod);
router.delete('/:id', authMiddleware, orgFilterMiddleware, requireAdmin, deletePaymentMethod);

export default router;
