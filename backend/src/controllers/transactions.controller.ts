import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const listTransactions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;

    if (!effectiveOrgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const { tipo, status, categoria, startDate, endDate, limit = '100', offset = '0' } = req.query;

    const where: any = {
      organizationId: effectiveOrgId,
    };

    if (tipo) where.tipo = tipo;
    if (status) where.status = status;
    if (categoria) where.categoria = categoria;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate as string);
      if (endDate) where.createdAt.lte = new Date(endDate as string);
    }

    const [transactions, total] = await Promise.all([
      prisma.financialTransaction.findMany({
        where,
        include: { reservation: { select: { id: true, guestName: true } } },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit as string),
        skip: parseInt(offset as string),
      }),
      prisma.financialTransaction.count({ where }),
    ]);

    res.json({
      data: transactions,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('List transactions error:', error);
    res.status(500).json({ error: 'Failed to list transactions' });
  }
};

export const getTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { effectiveOrgId } = req;

    const transaction = await prisma.financialTransaction.findUnique({
      where: { id },
      include: { reservation: true },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Check access
    if (effectiveOrgId && transaction.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(transaction);
  } catch (error) {
    console.error('Get transaction error:', error);
    res.status(500).json({ error: 'Failed to get transaction' });
  }
};

export const createTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;

    if (!effectiveOrgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const {
      tipo,
      categoria,
      descricao,
      valor,
      status = 'pendente',
      metodoPagto,
      dataVencimento,
      dataPagamento,
      reservationId,
    } = req.body;

    if (!tipo || !categoria || valor === undefined) {
      return res.status(400).json({ error: 'tipo, categoria, and valor are required' });
    }

    const transaction = await prisma.financialTransaction.create({
      data: {
        organizationId: effectiveOrgId,
        tipo,
        categoria,
        descricao,
        valor: parseFloat(valor),
        status,
        metodoPagto,
        dataVencimento: dataVencimento ? new Date(dataVencimento) : null,
        dataPagamento: dataPagamento ? new Date(dataPagamento) : null,
        reservationId,
      },
      include: { reservation: { select: { id: true, guestName: true } } },
    });

    res.status(201).json(transaction);
  } catch (error) {
    console.error('Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
};

export const updateTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { effectiveOrgId } = req;

    // Check if transaction exists and belongs to org
    const existing = await prisma.financialTransaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      tipo,
      categoria,
      descricao,
      valor,
      status,
      metodoPagto,
      dataVencimento,
      dataPagamento,
    } = req.body;

    const transaction = await prisma.financialTransaction.update({
      where: { id },
      data: {
        ...(tipo && { tipo }),
        ...(categoria && { categoria }),
        ...(descricao !== undefined && { descricao }),
        ...(valor !== undefined && { valor: parseFloat(valor) }),
        ...(status && { status }),
        ...(metodoPagto !== undefined && { metodoPagto }),
        ...(dataVencimento !== undefined && { dataVencimento: dataVencimento ? new Date(dataVencimento) : null }),
        ...(dataPagamento !== undefined && { dataPagamento: dataPagamento ? new Date(dataPagamento) : null }),
      },
      include: { reservation: { select: { id: true, guestName: true } } },
    });

    res.json(transaction);
  } catch (error) {
    console.error('Update transaction error:', error);
    res.status(500).json({ error: 'Failed to update transaction' });
  }
};

export const deleteTransaction = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { effectiveOrgId } = req;

    // Check if transaction exists and belongs to org
    const existing = await prisma.financialTransaction.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.financialTransaction.delete({
      where: { id },
    });

    res.json({ message: 'Transaction deleted successfully' });
  } catch (error) {
    console.error('Delete transaction error:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
};
