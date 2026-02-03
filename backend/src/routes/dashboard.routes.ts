import { Router } from 'express';
import { getDashboardStats, getRevenueChart } from '../controllers/dashboard.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { orgFilterMiddleware } from '../middleware/orgFilter.js';
import { requireStaff } from '../middleware/rbac.js';

const router = Router();

router.get('/stats', authMiddleware, orgFilterMiddleware, requireStaff, getDashboardStats);
router.get('/revenue-chart', authMiddleware, orgFilterMiddleware, requireStaff, getRevenueChart);

export default router;
