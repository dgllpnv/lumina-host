import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

const PAYMENT_TYPES = ['pix', 'cartao', 'dinheiro', 'transferencia'];

export const listPaymentMethods = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;
    if (!effectiveOrgId) return res.status(400).json({ error: 'Organization context required' });

    const methods = await prisma.paymentMethod.findMany({
      where: { organizationId: effectiveOrgId },
      orderBy: { createdAt: 'asc' },
    });
    res.json(methods);
  } catch (error) {
    console.error('List payment methods error:', error);
    res.status(500).json({ error: 'Failed to list payment methods' });
  }
};

export const createPaymentMethod = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;
    if (!effectiveOrgId) return res.status(400).json({ error: 'Organization context required' });

    const { tipo, instrucoes, ativo } = req.body;
    if (!tipo || !PAYMENT_TYPES.includes(tipo)) {
      return res.status(400).json({ error: `tipo must be one of: ${PAYMENT_TYPES.join(', ')}` });
    }

    const method = await prisma.paymentMethod.create({
      data: {
        organizationId: effectiveOrgId,
        tipo,
        instrucoes: instrucoes || null,
        ativo: ativo ?? true,
      },
    });
    res.status(201).json(method);
  } catch (error) {
    console.error('Create payment method error:', error);
    res.status(500).json({ error: 'Failed to create payment method' });
  }
};

export const updatePaymentMethod = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { effectiveOrgId } = req;

    const existing = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Payment method not found' });
    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { tipo, instrucoes, ativo } = req.body;
    if (tipo && !PAYMENT_TYPES.includes(tipo)) {
      return res.status(400).json({ error: `tipo must be one of: ${PAYMENT_TYPES.join(', ')}` });
    }

    const method = await prisma.paymentMethod.update({
      where: { id },
      data: {
        ...(tipo && { tipo }),
        ...(instrucoes !== undefined && { instrucoes }),
        ...(ativo !== undefined && { ativo }),
      },
    });
    res.json(method);
  } catch (error) {
    console.error('Update payment method error:', error);
    res.status(500).json({ error: 'Failed to update payment method' });
  }
};

export const deletePaymentMethod = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.params.id as string;
    const { effectiveOrgId } = req;

    const existing = await prisma.paymentMethod.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Payment method not found' });
    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.paymentMethod.delete({ where: { id } });
    res.json({ message: 'Payment method deleted successfully' });
  } catch (error) {
    console.error('Delete payment method error:', error);
    res.status(500).json({ error: 'Failed to delete payment method' });
  }
};
