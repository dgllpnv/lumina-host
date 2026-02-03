import { Router } from 'express';
import {
  login,
  register,
  refresh,
  logout,
  getMe,
  adminCreateUser,
} from '../controllers/auth.controller.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import { requireAdmin } from '../middleware/rbac.js';

const router = Router();

// Public routes
router.post('/login', login);
router.post('/register', register);
router.post('/refresh', refresh);

// Protected routes
router.post('/logout', optionalAuthMiddleware, logout);
router.get('/me', authMiddleware, getMe);

// Admin routes
router.post('/admin-create-user', authMiddleware, requireAdmin, adminCreateUser);

export default router;
