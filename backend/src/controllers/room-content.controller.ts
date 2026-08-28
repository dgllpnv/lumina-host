import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

async function assertRoomAccess(req: AuthenticatedRequest, tableRoomId: string) {
  const room = await prisma.tableRoom.findUnique({ where: { id: tableRoomId } });
  if (!room) return { room: null, allowed: false };
  const allowed = !req.effectiveOrgId || room.organizationId === req.effectiveOrgId;
  return { room, allowed };
}

export const getRoomContent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tableRoomId = req.params.tableRoomId as string;
    const { room, allowed } = await assertRoomAccess(req, tableRoomId);

    if (!room) return res.status(404).json({ error: 'Table/room not found' });
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const content = await prisma.roomContent.findUnique({ where: { tableRoomId } });
    res.json(content);
  } catch (error) {
    console.error('Get room content error:', error);
    res.status(500).json({ error: 'Failed to get room content' });
  }
};

export const upsertRoomContent = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const tableRoomId = req.params.tableRoomId as string;
    const { room, allowed } = await assertRoomAccess(req, tableRoomId);

    if (!room) return res.status(404).json({ error: 'Table/room not found' });
    if (!allowed) return res.status(403).json({ error: 'Access denied' });

    const { descricaoLonga, fotos, tarifaBaixaTemp, tarifaAltaTemp } = req.body;

    const content = await prisma.roomContent.upsert({
      where: { tableRoomId },
      update: {
        ...(descricaoLonga !== undefined && { descricaoLonga }),
        ...(fotos !== undefined && { fotos }),
        ...(tarifaBaixaTemp !== undefined && { tarifaBaixaTemp: tarifaBaixaTemp === null ? null : parseFloat(tarifaBaixaTemp) }),
        ...(tarifaAltaTemp !== undefined && { tarifaAltaTemp: tarifaAltaTemp === null ? null : parseFloat(tarifaAltaTemp) }),
      },
      create: {
        tableRoomId,
        descricaoLonga: descricaoLonga || null,
        fotos: fotos || [],
        tarifaBaixaTemp: tarifaBaixaTemp ? parseFloat(tarifaBaixaTemp) : null,
        tarifaAltaTemp: tarifaAltaTemp ? parseFloat(tarifaAltaTemp) : null,
      },
    });

    res.json(content);
  } catch (error) {
    console.error('Upsert room content error:', error);
    res.status(500).json({ error: 'Failed to save room content' });
  }
};
