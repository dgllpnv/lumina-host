import { Response } from 'express';
import { prisma } from '../index.js';
import { AuthenticatedRequest } from '../middleware/auth.js';

export const listOrganizations = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    let organizations: Awaited<ReturnType<typeof prisma.organization.findMany>>;

    if (req.user.role === 'super_admin') {
      // Super admin can see all organizations
      organizations = await prisma.organization.findMany({
        orderBy: { nome: 'asc' },
        include: {
          _count: {
            select: { profiles: true }
          }
        }
      });
    } else if (req.user.organizationId) {
      // Regular users can only see their own organization
      organizations = await prisma.organization.findMany({
        where: { id: req.user.organizationId },
        include: {
          _count: {
            select: { profiles: true }
          }
        }
      });
    } else {
      organizations = [];
    }

    res.json(organizations);
  } catch (error) {
    console.error('List organizations error:', error);
    res.status(500).json({ error: 'Failed to list organizations' });
  }
};

export const getOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const id = req.params.id as string;

    // Check access
    if (req.user.role !== 'super_admin' && req.user.organizationId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        _count: {
          select: { profiles: true, transactions: true, inventory: true }
        }
      }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(organization);
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Failed to get organization' });
  }
};

export const createOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { nome, tipo, plano } = req.body;

    if (!nome) {
      return res.status(400).json({ error: 'Nome is required' });
    }

    const organization = await prisma.organization.create({
      data: {
        nome,
        tipo: tipo || 'restaurante',
        plano: plano || 'basico',
        ativo: true,
      }
    });

    res.status(201).json(organization);
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
};

export const updateOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const id = req.params.id as string;
    const { nome, tipo, plano, ativo } = req.body;

    // Check access
    if (req.user.role !== 'super_admin' && req.user.organizationId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only super_admin can change ativo status
    if (ativo !== undefined && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can change organization status' });
    }

    const organization = await prisma.organization.update({
      where: { id },
      data: {
        ...(nome && { nome }),
        ...(tipo && { tipo }),
        ...(plano && { plano }),
        ...(ativo !== undefined && { ativo }),
      }
    });

    res.json(organization);
  } catch (error) {
    console.error('Update organization error:', error);
    res.status(500).json({ error: 'Failed to update organization' });
  }
};

export const deleteOrganization = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const id = req.params.id as string;

    // Check if organization has users
    const userCount = await prisma.profile.count({
      where: { organizationId: id }
    });

    if (userCount > 0) {
      return res.status(400).json({
        error: 'Cannot delete organization with users',
        message: 'Please reassign or delete all users first'
      });
    }

    await prisma.organization.delete({
      where: { id }
    });

    res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Delete organization error:', error);
    res.status(500).json({ error: 'Failed to delete organization' });
  }
};
