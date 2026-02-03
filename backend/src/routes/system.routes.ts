import { Router } from 'express';
import { getSystemStatus, setupSuperAdmin } from '../controllers/system.controller.js';

const router = Router();

router.get('/status', getSystemStatus);
router.post('/setup-super-admin', setupSuperAdmin);

export default router;
