import { Router } from 'express';
import {
  getPublicSite,
  getRoomAvailability,
  createPublicReservation,
  getRoomCalendarIcs,
} from '../controllers/public-site.controller.js';

const router = Router();

router.get('/:orgSlug/site', getPublicSite);
router.get('/:orgSlug/rooms/:roomId/availability', getRoomAvailability);
router.post('/:orgSlug/reservations', createPublicReservation);
router.get('/:orgSlug/rooms/:roomId/calendar.ics', getRoomCalendarIcs);

export default router;
