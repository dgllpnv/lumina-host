import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const listReservations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;

    if (!effectiveOrgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const { status, roomId, startDate, endDate, guestName, limit = '100', offset = '0' } = req.query;

    const where: any = {
      organizationId: effectiveOrgId,
    };

    if (status) where.status = status;
    if (roomId) where.roomId = roomId;
    if (guestName) where.guestName = { contains: guestName as string, mode: 'insensitive' };

    // Date range filter
    if (startDate || endDate) {
      where.OR = [
        {
          checkinDate: {
            ...(startDate && { gte: new Date(startDate as string) }),
            ...(endDate && { lte: new Date(endDate as string) }),
          },
        },
        {
          checkoutDate: {
            ...(startDate && { gte: new Date(startDate as string) }),
            ...(endDate && { lte: new Date(endDate as string) }),
          },
        },
      ];
    }

    const [reservations, total] = await Promise.all([
      prisma.reservation.findMany({
        where,
        include: {
          room: { select: { id: true, nome: true, tipo: true } },
        },
        orderBy: { checkinDate: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.reservation.count({ where }),
    ]);

    res.json({
      data: reservations,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('List reservations error:', error);
    res.status(500).json({ error: 'Failed to list reservations' });
  }
};

export const getReservation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { effectiveOrgId } = req;

    const reservation = await prisma.reservation.findUnique({
      where: { id },
      include: {
        room: true,
        transactions: true,
      },
    });

    if (!reservation) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (effectiveOrgId && reservation.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ error: 'Failed to get reservation' });
  }
};

export const createReservation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;

    if (!effectiveOrgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const {
      roomId,
      roomNumber,
      roomType,
      guestName,
      guestEmail,
      guestPhone,
      guestDocument,
      checkinDate,
      checkoutDate,
      dailyRate,
      notes,
    } = req.body;

    if (!guestName || !checkinDate || !checkoutDate || !dailyRate) {
      return res.status(400).json({
        error: 'guestName, checkinDate, checkoutDate, and dailyRate are required',
      });
    }

    // Validate room if provided
    let room = null;
    let finalRoomNumber = roomNumber;
    let finalRoomType = roomType;

    if (roomId) {
      room = await prisma.tableRoom.findUnique({
        where: { id: roomId },
      });

      if (!room) {
        return res.status(404).json({ error: 'Room not found' });
      }

      if (room.organizationId !== effectiveOrgId) {
        return res.status(403).json({ error: 'Room belongs to another organization' });
      }

      finalRoomNumber = room.nome;
      finalRoomType = room.tipo;
    }

    if (!finalRoomNumber || !finalRoomType) {
      return res.status(400).json({ error: 'roomNumber and roomType are required' });
    }

    // Calculate total stay
    const checkin = new Date(checkinDate);
    const checkout = new Date(checkoutDate);
    const nights = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));
    const totalStay = nights * parseFloat(dailyRate);

    const reservation = await prisma.reservation.create({
      data: {
        organizationId: effectiveOrgId,
        roomId,
        roomNumber: finalRoomNumber,
        roomType: finalRoomType,
        guestName,
        guestEmail,
        guestPhone,
        guestDocument,
        checkinDate: checkin,
        checkoutDate: checkout,
        dailyRate: parseFloat(dailyRate),
        totalStay,
        notes,
        status: 'reservado',
      },
      include: {
        room: { select: { id: true, nome: true, tipo: true } },
      },
    });

    // Update room status if linked
    if (roomId) {
      await prisma.tableRoom.update({
        where: { id: roomId },
        data: { status: 'reservado' },
      });
    }

    res.status(201).json(reservation);
  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ error: 'Failed to create reservation' });
  }
};

export const updateReservation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { effectiveOrgId } = req;

    const existing = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      roomId,
      roomNumber,
      roomType,
      guestName,
      guestEmail,
      guestPhone,
      guestDocument,
      checkinDate,
      checkoutDate,
      dailyRate,
      totalStay,
      notes,
      status,
      actualCheckin,
      actualCheckout,
    } = req.body;

    // Recalculate total if dates or rate changed
    let newTotalStay = totalStay;
    if ((checkinDate || checkoutDate || dailyRate) && !totalStay) {
      const checkin = new Date(checkinDate || existing.checkinDate);
      const checkout = new Date(checkoutDate || existing.checkoutDate);
      const rate = parseFloat(dailyRate) || existing.dailyRate;
      const nights = Math.ceil((checkout.getTime() - checkin.getTime()) / (1000 * 60 * 60 * 24));
      newTotalStay = nights * rate;
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        ...(roomId !== undefined && { roomId }),
        ...(roomNumber && { roomNumber }),
        ...(roomType && { roomType }),
        ...(guestName && { guestName }),
        ...(guestEmail !== undefined && { guestEmail }),
        ...(guestPhone !== undefined && { guestPhone }),
        ...(guestDocument !== undefined && { guestDocument }),
        ...(checkinDate && { checkinDate: new Date(checkinDate) }),
        ...(checkoutDate && { checkoutDate: new Date(checkoutDate) }),
        ...(dailyRate !== undefined && { dailyRate: parseFloat(dailyRate) }),
        ...(newTotalStay !== undefined && { totalStay: newTotalStay }),
        ...(notes !== undefined && { notes }),
        ...(status && { status }),
        ...(actualCheckin !== undefined && { actualCheckin: actualCheckin ? new Date(actualCheckin) : null }),
        ...(actualCheckout !== undefined && { actualCheckout: actualCheckout ? new Date(actualCheckout) : null }),
      },
      include: {
        room: { select: { id: true, nome: true, tipo: true } },
      },
    });

    // Update room status based on reservation status
    if (status && reservation.roomId) {
      let roomStatus = 'reservado';
      if (status === 'checkin') roomStatus = 'ocupado';
      else if (status === 'checkout') roomStatus = 'sujo';
      else if (status === 'cancelado') roomStatus = 'livre';

      await prisma.tableRoom.update({
        where: { id: reservation.roomId },
        data: { status: roomStatus as any },
      });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Update reservation error:', error);
    res.status(500).json({ error: 'Failed to update reservation' });
  }
};

export const checkIn = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { effectiveOrgId } = req;

    const existing = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (existing.status !== 'reservado') {
      return res.status(400).json({ error: 'Can only check-in reserved reservations' });
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'checkin',
        actualCheckin: new Date(),
      },
      include: {
        room: { select: { id: true, nome: true, tipo: true } },
      },
    });

    // Update room status
    if (reservation.roomId) {
      await prisma.tableRoom.update({
        where: { id: reservation.roomId },
        data: { status: 'ocupado' },
      });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Failed to check-in' });
  }
};

export const checkOut = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { effectiveOrgId } = req;
    const { createTransaction = true } = req.body;

    const existing = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (existing.status !== 'checkin') {
      return res.status(400).json({ error: 'Can only check-out guests who have checked in' });
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: {
        status: 'checkout',
        actualCheckout: new Date(),
      },
      include: {
        room: { select: { id: true, nome: true, tipo: true } },
      },
    });

    // Update room status
    if (reservation.roomId) {
      await prisma.tableRoom.update({
        where: { id: reservation.roomId },
        data: { status: 'sujo' },
      });
    }

    // Create financial transaction for checkout
    if (createTransaction && reservation.totalStay) {
      await prisma.financialTransaction.create({
        data: {
          organizationId: reservation.organizationId,
          tipo: 'receita',
          categoria: 'hospedagem',
          descricao: `Checkout - ${reservation.guestName} - ${reservation.roomNumber}`,
          valor: reservation.totalStay,
          status: 'pago',
          metodoPagto: 'pendente',
          dataPagamento: new Date(),
          reservationId: reservation.id,
        },
      });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Check-out error:', error);
    res.status(500).json({ error: 'Failed to check-out' });
  }
};

export const cancelReservation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { effectiveOrgId } = req;

    const existing = await prisma.reservation.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Reservation not found' });
    }

    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (existing.status === 'checkout') {
      return res.status(400).json({ error: 'Cannot cancel a completed reservation' });
    }

    const reservation = await prisma.reservation.update({
      where: { id },
      data: { status: 'cancelado' },
      include: {
        room: { select: { id: true, nome: true, tipo: true } },
      },
    });

    // Update room status
    if (reservation.roomId) {
      await prisma.tableRoom.update({
        where: { id: reservation.roomId },
        data: { status: 'livre' },
      });
    }

    res.json(reservation);
  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ error: 'Failed to cancel reservation' });
  }
};
