import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const listPackages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;
    if (!effectiveOrgId) return res.status(400).json({ error: 'Organization context required' });

    const packages = await prisma.package.findMany({
      where: { organizationId: effectiveOrgId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(packages);
  } catch (error) {
    console.error('List packages error:', error);
    res.status(500).json({ error: 'Failed to list packages' });
  }
};

export const createPackage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;
    if (!effectiveOrgId) return res.status(400).json({ error: 'Organization context required' });

    const { nome, descricao, precoPromocional, vigenciaInicio, vigenciaFim, ativo } = req.body;
    if (!nome) return res.status(400).json({ error: 'Nome is required' });

    const pkg = await prisma.package.create({
      data: {
        organizationId: effectiveOrgId,
        nome,
        descricao: descricao || null,
        precoPromocional: precoPromocional ? parseFloat(precoPromocional) : null,
        vigenciaInicio: vigenciaInicio ? new Date(vigenciaInicio) : null,
        vigenciaFim: vigenciaFim ? new Date(vigenciaFim) : null,
        ativo: ativo ?? true,
      },
    });
    res.status(201).json(pkg);
  } catch (error) {
    console.error('Create package error:', error);
    res.status(500).json({ error: 'Failed to create package' });
  }
};

export const updatePackage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { effectiveOrgId } = req;

    const existing = await prisma.package.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Package not found' });
    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { nome, descricao, precoPromocional, vigenciaInicio, vigenciaFim, ativo } = req.body;

    const pkg = await prisma.package.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(descricao !== undefined && { descricao }),
        ...(precoPromocional !== undefined && { precoPromocional: precoPromocional === null ? null : parseFloat(precoPromocional) }),
        ...(vigenciaInicio !== undefined && { vigenciaInicio: vigenciaInicio ? new Date(vigenciaInicio) : null }),
        ...(vigenciaFim !== undefined && { vigenciaFim: vigenciaFim ? new Date(vigenciaFim) : null }),
        ...(ativo !== undefined && { ativo }),
      },
    });
    res.json(pkg);
  } catch (error) {
    console.error('Update package error:', error);
    res.status(500).json({ error: 'Failed to update package' });
  }
};

export const deletePackage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { effectiveOrgId } = req;

    const existing = await prisma.package.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Package not found' });
    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.package.delete({ where: { id } });
    res.json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Delete package error:', error);
    res.status(500).json({ error: 'Failed to delete package' });
  }
};
