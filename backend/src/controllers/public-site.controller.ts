import { Request, Response } from 'express';
import { prisma } from '../index.js';

async function findPublishedOrg(orgSlug: string) {
  const org = await prisma.organization.findUnique({ where: { siteSlug: orgSlug } });
  if (!org) return { org: null, reason: 'not_found' as const };
  if (!org.sitePublished) return { org: null, reason: 'not_published' as const };
  if (org.contractStatus !== 'ativo') return { org: null, reason: 'inactive' as const };
  return { org, reason: null };
}

// GET /api/public/:orgSlug/site
// Tudo que a "vitrine" precisa numa chamada só: quartos + conteúdo, pacotes,
// dicas e formas de pagamento. Sem autenticação — é o que alimenta o site
// público do cliente (ver Parte 2 do dossiê, seção 04).
export const getPublicSite = async (req: Request, res: Response) => {
  try {
    const orgSlug = req.params.orgSlug as string;
    const { org, reason } = await findPublishedOrg(orgSlug);

    if (!org) {
      if (reason === 'inactive') return res.status(503).json({ error: 'Site temporariamente indisponível' });
      return res.status(404).json({ error: 'Site not found' });
    }

    const [rooms, packages, tips, paymentMethods] = await Promise.all([
      prisma.tableRoom.findMany({
        where: { organizationId: org.id, tipo: 'quarto' },
        include: { content: true },
        orderBy: { nome: 'asc' },
      }),
      prisma.package.findMany({ where: { organizationId: org.id, ativo: true } }),
      prisma.contentTip.findMany({ where: { organizationId: org.id }, orderBy: { ordem: 'asc' } }),
      prisma.paymentMethod.findMany({ where: { organizationId: org.id, ativo: true } }),
    ]);

    res.json({
      organization: {
        nome: org.nome,
        logoUrl: org.logoUrl,
      },
      rooms,
      packages,
      tips,
      paymentMethods,
    });
  } catch (error) {
    console.error('Get public site error:', error);
    res.status(500).json({ error: 'Failed to load site' });
  }
};

// GET /api/public/:orgSlug/rooms/:roomId/availability?checkin&checkout
// Combina reservas ativas + bloqueios importados da Booking.com (iCal).
export const getRoomAvailability = async (req: Request, res: Response) => {
  try {
    const orgSlug = req.params.orgSlug as string;
    const roomId = req.params.roomId as string;
    const { org, reason } = await findPublishedOrg(orgSlug);
    if (!org) {
      if (reason === 'inactive') return res.status(503).json({ error: 'Site temporariamente indisponível' });
      return res.status(404).json({ error: 'Site not found' });
    }

    const room = await prisma.tableRoom.findUnique({ where: { id: roomId } });
    if (!room || room.organizationId !== org.id) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const [reservations, blocks] = await Promise.all([
      prisma.reservation.findMany({
        where: { roomId, status: { in: ['reservado', 'checkin'] } },
        select: { checkinDate: true, checkoutDate: true },
      }),
      prisma.externalCalendarBlock.findMany({
        where: { tableRoomId: roomId },
        select: { checkin: true, checkout: true },
      }),
    ]);

    const blockedRanges = [
      ...reservations.map(r => ({ checkin: r.checkinDate, checkout: r.checkoutDate })),
      ...blocks.map(b => ({ checkin: b.checkin, checkout: b.checkout })),
    ];

    const { checkin, checkout } = req.query;
    let available = true;
    if (checkin && checkout) {
      const wantedCheckin = new Date(checkin as string);
      const wantedCheckout = new Date(checkout as string);
      available = !blockedRanges.some(
        r => wantedCheckin < r.checkout && wantedCheckout > r.checkin
      );
    }

    res.json({ available, blockedRanges });
  } catch (error) {
    console.error('Get room availability error:', error);
    res.status(500).json({ error: 'Failed to get availability' });
  }
};

// POST /api/public/:orgSlug/reservations
// Reserva direta pelo site — cria com source "site" e status "reservado"
// (pendente de confirmação do admin; sem gateway de pagamento na Fase 01).
export const createPublicReservation = async (req: Request, res: Response) => {
  try {
    const orgSlug = req.params.orgSlug as string;
    const { org, reason } = await findPublishedOrg(orgSlug);
    if (!org) {
      if (reason === 'inactive') return res.status(503).json({ error: 'Site temporariamente indisponível' });
      return res.status(404).json({ error: 'Site not found' });
    }

    const { roomId, guestName, guestEmail, guestPhone, checkinDate, checkoutDate } = req.body;
    if (!roomId || !guestName || !guestEmail || !checkinDate || !checkoutDate) {
      return res.status(400).json({
        error: 'roomId, guestName, guestEmail, checkinDate and checkoutDate are required',
      });
    }

    const room = await prisma.tableRoom.findUnique({ where: { id: roomId }, include: { content: true } });
    if (!room || room.organizationId !== org.id) {
      return res.status(404).json({ error: 'Room not found' });
    }

    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    const nights = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));
    const dailyRate = room.content?.tarifaBaixaTemp ?? room.precoBase ?? 0;

    const reservation = await prisma.reservation.create({
      data: {
        organizationId: org.id,
        roomId: room.id,
        roomNumber: room.nome,
        roomType: room.tipo,
        guestName,
        guestEmail,
        guestPhone: guestPhone || null,
        checkinDate: checkin,
        checkoutDate: checkout,
        dailyRate,
        totalStay: nights * dailyRate,
        status: 'reservado',
        source: 'site',
        notes: 'Reserva feita pelo site — aguardando confirmação do admin.',
      },
    });

    res.status(201).json({ reservation, message: 'Reserva recebida. A pousada confirmará em breve.' });
  } catch (error) {
    console.error('Create public reservation error:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
};

// GET /api/public/:orgSlug/rooms/:roomId/calendar.ics
// Exporta as reservas do Lumina em ICS — o admin cola essa URL na extranet da
// Booking.com para que reservas feitas no site bloqueiem lá também.
export const getRoomCalendarIcs = async (req: Request, res: Response) => {
  try {
    const orgSlug = req.params.orgSlug as string;
    const roomId = req.params.roomId as string;
    const { org } = await findPublishedOrg(orgSlug);
    if (!org) return res.status(404).send('Not found');

    const room = await prisma.tableRoom.findUnique({ where: { id: roomId } });
    if (!room || room.organizationId !== org.id) return res.status(404).send('Not found');

    const reservations = await prisma.reservation.findMany({
      where: { roomId, status: { in: ['reservado', 'checkin'] } },
    });

    const toIcsDate = (d: Date) => d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const events = reservations
      .map(
        r => `BEGIN:VEVENT
UID:lumina-${r.id}@lumina.host
DTSTART:${toIcsDate(r.checkinDate)}
DTEND:${toIcsDate(r.checkoutDate)}
SUMMARY:Reservado
END:VEVENT`
      )
      .join('\n');

    const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Lumina Host//${org.nome}//PT
${events}
END:VCALENDAR`;

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.send(ics);
  } catch (error) {
    console.error('Get room calendar ICS error:', error);
    res.status(500).send('Failed to generate calendar');
  }
};
