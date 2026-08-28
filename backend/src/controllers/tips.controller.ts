import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

// "gastronomia" reaproveita este mesmo modelo para as opções de comida no
// local (ex: café da manhã da própria pousada, restaurante parceiro ao lado)
// em vez de criar uma tabela nova só para isso.
const TIP_TYPES = ['passeio', 'transfer', 'gastronomia'];

export const listTips = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;
    if (!effectiveOrgId) return res.status(400).json({ error: 'Organization context required' });

    const { tipo } = req.query;
    const where: any = { organizationId: effectiveOrgId };
    if (tipo) where.tipo = tipo;

    const tips = await prisma.contentTip.findMany({ where, orderBy: { ordem: 'asc' } });
    res.json(tips);
  } catch (error) {
    console.error('List tips error:', error);
    res.status(500).json({ error: 'Failed to list tips' });
  }
};

export const createTip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;
    if (!effectiveOrgId) return res.status(400).json({ error: 'Organization context required' });

    const { tipo, titulo, descricao, fotos, ordem } = req.body;
    if (!tipo || !TIP_TYPES.includes(tipo)) {
      return res.status(400).json({ error: `tipo must be one of: ${TIP_TYPES.join(', ')}` });
    }
    if (!titulo) return res.status(400).json({ error: 'Titulo is required' });

    const tip = await prisma.contentTip.create({
      data: {
        organizationId: effectiveOrgId,
        tipo,
        titulo,
        descricao: descricao || null,
        fotos: fotos || [],
        ordem: ordem ?? 0,
      },
    });
    res.status(201).json(tip);
  } catch (error) {
    console.error('Create tip error:', error);
    res.status(500).json({ error: 'Failed to create tip' });
  }
};

export const updateTip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { effectiveOrgId } = req;

    const existing = await prisma.contentTip.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Tip not found' });
    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { tipo, titulo, descricao, fotos, ordem } = req.body;
    if (tipo && !TIP_TYPES.includes(tipo)) {
      return res.status(400).json({ error: `tipo must be one of: ${TIP_TYPES.join(', ')}` });
    }

    const tip = await prisma.contentTip.update({
      where: { id },
      data: {
        ...(tipo && { tipo }),
        ...(titulo && { titulo }),
        ...(descricao !== undefined && { descricao }),
        ...(fotos !== undefined && { fotos }),
        ...(ordem !== undefined && { ordem }),
      },
    });
    res.json(tip);
  } catch (error) {
    console.error('Update tip error:', error);
    res.status(500).json({ error: 'Failed to update tip' });
  }
};

export const deleteTip = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { effectiveOrgId } = req;

    const existing = await prisma.contentTip.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Tip not found' });
    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.contentTip.delete({ where: { id } });
    res.json({ message: 'Tip deleted successfully' });
  } catch (error) {
    console.error('Delete tip error:', error);
    res.status(500).json({ error: 'Failed to delete tip' });
  }
};
