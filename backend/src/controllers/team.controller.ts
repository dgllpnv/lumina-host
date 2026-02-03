import { Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index.js';
import { AuthenticatedRequest, AppRole } from '../middleware/auth.js';

export const listTeamMembers = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { effectiveOrgId } = req;

    let members;

    if (req.user.role === 'super_admin' && !effectiveOrgId) {
      // Super admin without org filter sees all users
      members = await prisma.profile.findMany({
        select: {
          id: true,
          email: true,
          nome: true,
          role: true,
          avatarUrl: true,
          organizationId: true,
          organization: { select: { id: true, nome: true } },
          createdAt: true,
        },
        orderBy: { nome: 'asc' }
      });
    } else {
      // Filter by organization
      members = await prisma.profile.findMany({
        where: { organizationId: effectiveOrgId },
        select: {
          id: true,
          email: true,
          nome: true,
          role: true,
          avatarUrl: true,
          organizationId: true,
          organization: { select: { id: true, nome: true } },
          createdAt: true,
        },
        orderBy: { nome: 'asc' }
      });
    }

    res.json(members);
  } catch (error) {
    console.error('List team members error:', error);
    res.status(500).json({ error: 'Failed to list team members' });
  }
};

export const getTeamMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    const member = await prisma.profile.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        avatarUrl: true,
        organizationId: true,
        organization: { select: { id: true, nome: true } },
        createdAt: true,
      }
    });

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Check access
    if (req.user.role !== 'super_admin' && member.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(member);
  } catch (error) {
    console.error('Get team member error:', error);
    res.status(500).json({ error: 'Failed to get team member' });
  }
};

export const updateTeamMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;
    const { nome, role, organizationId, password } = req.body;

    // Get current member
    const currentMember = await prisma.profile.findUnique({
      where: { id }
    });

    if (!currentMember) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Check access
    if (req.user.role !== 'super_admin' && currentMember.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only super_admin can change roles to/from super_admin
    if (role) {
      const validRoles: AppRole[] = ['super_admin', 'admin', 'staff'];
      if (!validRoles.includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }

      if ((role === 'super_admin' || currentMember.role === 'super_admin') && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admin can modify super admin roles' });
      }
    }

    // Only super_admin can change organization
    if (organizationId !== undefined && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can change organization' });
    }

    // Build update data
    const updateData: any = {};
    if (nome !== undefined) updateData.nome = nome;
    if (role !== undefined) updateData.role = role;
    if (organizationId !== undefined) updateData.organizationId = organizationId;

    // Hash new password if provided
    if (password) {
      updateData.passwordHash = await bcrypt.hash(password, 12);
    }

    const member = await prisma.profile.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        nome: true,
        role: true,
        avatarUrl: true,
        organizationId: true,
        organization: { select: { id: true, nome: true } },
        createdAt: true,
      }
    });

    // Update user role record if role changed
    if (role !== undefined) {
      await prisma.userRole.updateMany({
        where: { userId: id },
        data: { role }
      });
    }

    res.json(member);
  } catch (error) {
    console.error('Update team member error:', error);
    res.status(500).json({ error: 'Failed to update team member' });
  }
};

export const deleteTeamMember = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { id } = req.params;

    // Cannot delete self
    if (id === req.user.userId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Get member
    const member = await prisma.profile.findUnique({
      where: { id }
    });

    if (!member) {
      return res.status(404).json({ error: 'Team member not found' });
    }

    // Check access
    if (req.user.role !== 'super_admin' && member.organizationId !== req.user.organizationId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Only super_admin can delete other super_admins
    if (member.role === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admin can delete super admin users' });
    }

    await prisma.profile.delete({
      where: { id }
    });

    res.json({ message: 'Team member deleted successfully' });
  } catch (error) {
    console.error('Delete team member error:', error);
    res.status(500).json({ error: 'Failed to delete team member' });
  }
};
