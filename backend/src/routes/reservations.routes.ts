import { Router } from 'express';
import {
  listReservations,
  getReservation,
  createReservation,
  updateReservation,
  checkIn,
  checkOut,
  cancelReservation,
} from '../controllers/reservations.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { orgFilterMiddleware } from '../middleware/orgFilter.js';
import { requireStaff, requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/', authMiddleware, orgFilterMiddleware, requireStaff, listReservations);
router.get('/:id', authMiddleware, orgFilterMiddleware, requireStaff, getReservation);
router.post('/', authMiddleware, orgFilterMiddleware, requireStaff, createReservation);
router.put('/:id', authMiddleware, orgFilterMiddleware, requireStaff, updateReservation);
router.post('/:id/check-in', authMiddleware, orgFilterMiddleware, requireStaff, checkIn);
router.post('/:id/check-out', authMiddleware, orgFilterMiddleware, requireStaff, checkOut);
router.post('/:id/cancel', authMiddleware, orgFilterMiddleware, requireAdmin, cancelReservation);

export default router;
