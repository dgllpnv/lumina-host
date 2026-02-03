import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index.js';

export const getSystemStatus = async (req: Request, res: Response) => {
  try {
    const superAdminCount = await prisma.profile.count({
      where: { role: 'super_admin' }
    });

    res.json({
      initialized: superAdminCount > 0,
      superAdminCount,
    });
  } catch (error) {
    console.error('System status error:', error);
    res.status(500).json({ error: 'Failed to get system status' });
  }
};

export const setupSuperAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password, nome } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if super admin already exists
    const existingSuperAdmin = await prisma.profile.findFirst({
      where: { role: 'super_admin' }
    });

    if (existingSuperAdmin) {
      return res.status(403).json({
        error: 'Super admin already exists',
        message: 'System is already initialized'
      });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create super admin
    const superAdmin = await prisma.profile.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        nome: nome || 'Super Admin',
        role: 'super_admin',
      }
    });

    // Create user role
    await prisma.userRole.create({
      data: {
        userId: superAdmin.id,
        role: 'super_admin',
      }
    });

    res.status(201).json({
      success: true,
      message: 'Super admin created successfully',
      user: {
        id: superAdmin.id,
        email: superAdmin.email,
        nome: superAdmin.nome,
        role: superAdmin.role,
      }
    });
  } catch (error) {
    console.error('Setup super admin error:', error);
    res.status(500).json({ error: 'Failed to setup super admin' });
  }
};
