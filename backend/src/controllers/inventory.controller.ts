import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const listInventory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;

    if (!effectiveOrgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const { categoria, lowStock } = req.query;

    const where: any = {
      organizationId: effectiveOrgId,
    };

    if (categoria) where.categoria = categoria;

    let items = await prisma.inventoryItem.findMany({
      where,
      orderBy: { nome: 'asc' },
    });

    // Filter low stock items
    if (lowStock === 'true') {
      items = items.filter(item =>
        item.estoqueMinimo !== null && item.quantidade <= item.estoqueMinimo
      );
    }

    res.json(items);
  } catch (error) {
    console.error('List inventory error:', error);
    res.status(500).json({ error: 'Failed to list inventory' });
  }
};

export const getInventoryItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { effectiveOrgId } = req;

    const item = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!item) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    if (effectiveOrgId && item.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(item);
  } catch (error) {
    console.error('Get inventory item error:', error);
    res.status(500).json({ error: 'Failed to get inventory item' });
  }
};

export const createInventoryItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { effectiveOrgId } = req;

    if (!effectiveOrgId) {
      return res.status(400).json({ error: 'Organization context required' });
    }

    const {
      nome,
      quantidade = 0,
      unidade = 'un',
      categoria,
      estoqueMinimo,
      precoUnitario,
    } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome is required' });
    }

    const item = await prisma.inventoryItem.create({
      data: {
        organizationId: effectiveOrgId,
        nome,
        quantidade: parseInt(quantidade),
        unidade,
        categoria,
        estoqueMinimo: estoqueMinimo ? parseInt(estoqueMinimo) : null,
        precoUnitario: precoUnitario ? parseFloat(precoUnitario) : null,
      },
    });

    res.status(201).json(item);
  } catch (error) {
    console.error('Create inventory item error:', error);
    res.status(500).json({ error: 'Failed to create inventory item' });
  }
};

export const updateInventoryItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { effectiveOrgId } = req;

    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const {
      nome,
      quantidade,
      unidade,
      categoria,
      estoqueMinimo,
      precoUnitario,
    } = req.body;

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(quantidade !== undefined && { quantidade: parseInt(quantidade) }),
        ...(unidade && { unidade }),
        ...(categoria !== undefined && { categoria }),
        ...(estoqueMinimo !== undefined && { estoqueMinimo: estoqueMinimo ? parseInt(estoqueMinimo) : null }),
        ...(precoUnitario !== undefined && { precoUnitario: precoUnitario ? parseFloat(precoUnitario) : null }),
      },
    });

    res.json(item);
  } catch (error) {
    console.error('Update inventory item error:', error);
    res.status(500).json({ error: 'Failed to update inventory item' });
  }
};

export const deleteInventoryItem = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { effectiveOrgId } = req;

    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.inventoryItem.delete({
      where: { id },
    });

    res.json({ message: 'Inventory item deleted successfully' });
  } catch (error) {
    console.error('Delete inventory item error:', error);
    res.status(500).json({ error: 'Failed to delete inventory item' });
  }
};

export const adjustInventory = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { effectiveOrgId } = req;
    const { adjustment, reason } = req.body;

    if (adjustment === undefined) {
      return res.status(400).json({ error: 'Adjustment value is required' });
    }

    const existing = await prisma.inventoryItem.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Inventory item not found' });
    }

    if (effectiveOrgId && existing.organizationId !== effectiveOrgId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const newQuantity = existing.quantidade + parseInt(adjustment);

    if (newQuantity < 0) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    const item = await prisma.inventoryItem.update({
      where: { id },
      data: { quantidade: newQuantity },
    });

    res.json({
      ...item,
      adjustment: parseInt(adjustment),
      reason,
    });
  } catch (error) {
    console.error('Adjust inventory error:', error);
    res.status(500).json({ error: 'Failed to adjust inventory' });
  }
};
