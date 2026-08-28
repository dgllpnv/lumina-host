import { Router } from 'express';
import {
  upsertIcalFeed,
  listIcalFeeds,
  syncIcalFeedNow,
  listUnlinkedBlocks,
  linkBlockToReservation,
} from '../controllers/ical-feeds.controller.js';
import { authMiddleware } from '../middleware/auth.js';
import { orgFilterMiddleware } from '../middleware/orgFilter.js';
import { requireStaff, requireAdmin } from '../middleware/rbac.js';

const router = Router();

router.get('/', authMiddleware, orgFilterMiddleware, requireStaff, listIcalFeeds);
router.put('/:tableRoomId', authMiddleware, orgFilterMiddleware, requireAdmin, upsertIcalFeed);
router.post('/:tableRoomId/sync-now', authMiddleware, orgFilterMiddleware, requireAdmin, syncIcalFeedNow);
router.get('/unlinked-blocks', authMiddleware, orgFilterMiddleware, requireStaff, listUnlinkedBlocks);
router.post('/blocks/:id/link', authMiddleware, orgFilterMiddleware, requireStaff, linkBlockToReservation);

export default router;
