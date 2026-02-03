import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const listTablesRooms = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;

    if (!effectiveOrgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const { tipo, status } = req.query;

    const where: any = {
      organizationId: effectiveOrgId,
    };

    if (tipo) where.tipo = tipo;
    if (status) where.status = status;

    const items = await prisma.tableRoom.findMany({
      where,
      orderBy: [{ andar: 'asc' }, { nome: 'asc' }],
    });

    res.json(items);
  } catch (error) {
    console.error('List tables/rooms error:', error);
    res.status(500).json({ error: 'Failed to list tables/rooms' });
  }
};

export const getTableRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { effectiveOrgId } = req;

    const item = await prisma.tableRoom.findUnique({
      where: { id },
      include: {
        reservations: {
          where: {
            status: { in: ['reservado', 'checkin'] },
          },
          orderBy: { checkinDate: 'asc' },
          take: 5,
        },
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Table/room not found' });
    }

    if (effectiveOrgId && item.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get table/room error:', error);
    res.status(500).json({ error: 'Failed to get table/room' });
  }
};

export const createTableRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;

    if (!effectiveOrgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const {
      nome,
      tipo = 'mesa',
      status = 'livre',
      capacidade,
      andar,
      descricao,
      precoBase,
    } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome is required' });
    }

    const item = await prisma.tableRoom.create({
      data: {
        organizationId: effectiveOrgId,
        nome,
        tipo,
        status,
        capacidade: capacidade ? parseInt(capacidade) : null,
        andar: andar ? parseInt(andar) : null,
        descricao,
        precoBase: precoBase ? parseFloat(precoBase) : null,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create table/room error:', error);
    res.status(500).json({ error: 'Failed to create table/room' });
  }
};

export const updateTableRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { effectiveOrgId } = req;

    const existing = await prisma.tableRoom.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Table/room not found' });
    }

    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      nome,
      tipo,
      status,
      capacidade,
      andar,
      descricao,
      precoBase,
    } = req.body;

    const item = await prisma.tableRoom.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(tipo && { tipo }),
        ...(status && { status }),
        ...(capacidade !== undefined && { capacidade: capacidade ? parseInt(capacidade) : null }),
        ...(andar !== undefined && { andar: andar ? parseInt(andar) : null }),
        ...(descricao !== undefined && { descricao }),
        ...(precoBase !== undefined && { precoBase: precoBase ? parseFloat(precoBase) : null }),
      },
    });

    res.json(item);
  } catch (error) {
    console.error('Update table/room error:', error);
    res.status(500).json({ error: 'Failed to update table/room' });
  }
};

export const deleteTableRoom = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { effectiveOrgId } = req;

    const existing = await prisma.tableRoom.findUnique({
      where: { id },
      include: {
        _count: { select: { reservations: true } },
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Table/room not found' });
    }

    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Check for active reservations
    const activeReservations = await prisma.reservation.count({
      where: {
        roomId: id,
        status: { in: ['reservado', 'checkin'] },
      },
    });

    if (activeReservations > 0) {
      return res.status(400).json({
        error: 'Cannot delete table/room with active reservations',
      });
    }

    await prisma.tableRoom.delete({
      where: { id },
    });

    res.json({ message: 'Table/room deleted successfully' });
  } catch (error) {
    console.error('Delete table/room error:', error);
    res.status(500).json({ error: 'Failed to delete table/room' });
  }
};

export const updateTableRoomStatus = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { effectiveOrgId } = req;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    const validStatuses = ['livre', 'ocupado', 'sujo', 'reservado'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const existing = await prisma.tableRoom.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Table/room not found' });
    }

    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const item = await prisma.tableRoom.update({
      where: { id },
      data: { status },
    });

    res.json(item);
  } catch (error) {
    console.error('Update table/room status error:', error);
    res.status(500).json({ error: 'Failed to update table/room status' });
  }
};
