import { Response } from 'express';
import ical, { VEvent } from 'node-ical';
import { prisma } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

async function assertRoomAccess(req: AuthenticatedRequest, tableRoomId: string) {
  const room = await prisma.tableRoom.findUnique({ where: { id: tableRoomId } });
  if (!room) return { room: null, allowed: false };
  const allowed = !req.effectiveOrgId || room.organizationId === req.effectiveOrgId;
  return { room, allowed };
}

export const upsertIcalFeed = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tableRoomId = req.params.tableRoomId as string;
    const { room, allowed } = await assertRoomAccess(req, tableRoomId);
    if (!room) return res.status(404).json({ error: 'Table/room not found' });
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const { importUrl } = req.body;

    const config = await prisma.icalFeedConfig.upsert({
      where: { tableRoomId },
      update: { importUrl: importUrl || null },
      create: { tableRoomId, importUrl: importUrl || null },
    });
    res.json(config);
  } catch (error) {
    console.error('Upsert ical feed error:', error);
    res.status(500).json({ error: 'Failed to save iCal feed config' });
  }
};

export const listIcalFeeds = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;
    if (!effectiveOrgId) return res.status(400).json({ error: 'Organization context required' });

    const feeds = await prisma.icalFeedConfig.findMany({
      where: { tableRoom: { organizationId: effectiveOrgId } },
      include: { tableRoom: { select: { id: true, nome: true, tipo: true } } },
    });
    res.json(feeds);
  } catch (error) {
    console.error('List ical feeds error:', error);
    res.status(500).json({ error: 'Failed to list iCal feeds' });
  }
};

// Importa o feed ICS de exportação da Booking.com e cria/atualiza bloqueios de
// data (ExternalCalendarBlock). O feed só traz datas — sem nome, contato ou
// valor do hóspede; o admin lança a reserva de verdade a partir do bloqueio.
export const syncIcalFeedNow = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tableRoomId = req.params.tableRoomId as string;
    const { room, allowed } = await assertRoomAccess(req, tableRoomId);
    if (!room) return res.status(404).json({ error: 'Table/room not found' });
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const config = await prisma.icalFeedConfig.findUnique({ where: { tableRoomId } });
    if (!config?.importUrl) {
      return res.status(400).json({ error: 'No import URL configured for this room' });
    }

    let created = 0;
    try {
      const events = await ical.async.fromURL(config.importUrl);

      for (const component of Object.values(events)) {
        const event = component as VEvent;
        if (event.type !== 'VEVENT' || !event.start || !event.end || !event.uid) continue;

        await prisma.externalCalendarBlock.upsert({
          where: { tableRoomId_externalUid: { tableRoomId, externalUid: event.uid } },
          update: { checkin: event.start, checkout: event.end },
          create: {
            tableRoomId,
            source: 'booking_ical',
            externalUid: event.uid,
            checkin: event.start,
            checkout: event.end,
          },
        });
        created++;
      }

      await prisma.icalFeedConfig.update({
        where: { tableRoomId },
        data: { lastSyncedAt: new Date(), lastSyncStatus: 'ok' },
      });

      res.json({ message: 'Sync completed', eventsProcessed: created });
    } catch (syncError) {
      await prisma.icalFeedConfig.update({
        where: { tableRoomId },
        data: { lastSyncedAt: new Date(), lastSyncStatus: 'erro' },
      });
      throw syncError;
    }
  } catch (error) {
    console.error('Sync ical feed error:', error);
    res.status(500).json({ error: 'Failed to sync iCal feed' });
  }
};

// Bloqueios importados que ainda não viraram uma Reservation real — a fila de
// "lançar manualmente" que o admin resolve olhando a extranet da Booking.com.
export const listUnlinkedBlocks = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;
    if (!effectiveOrgId) return res.status(400).json({ error: 'Organization context required' });

    const blocks = await prisma.externalCalendarBlock.findMany({
      where: {
        reservationId: null,
        tableRoom: { organizationId: effectiveOrgId },
      },
      include: { tableRoom: { select: { id: true, nome: true, tipo: true } } },
      orderBy: { checkin: 'asc' },
    });
    res.json(blocks);
  } catch (error) {
    console.error('List unlinked blocks error:', error);
    res.status(500).json({ error: 'Failed to list unlinked calendar blocks' });
  }
};

export const linkBlockToReservation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { reservationId } = req.body;
    if (!reservationId) return res.status(400).json({ error: 'reservationId is required' });

    const block = await prisma.externalCalendarBlock.findUnique({
      where: { id },
      include: { tableRoom: true },
    });
    if (!block) return res.status(404).json({ error: 'Block not found' });
    if (req.effectiveOrgId && block.tableRoom.organizationId !== req.effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updated = await prisma.externalCalendarBlock.update({
      where: { id },
      data: { reservationId },
    });
    res.json(updated);
  } catch (error) {
    console.error('Link block error:', error);
    res.status(500).json({ error: 'Failed to link block to reservation' });
  }
};
