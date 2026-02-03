import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';
import { AuthenticatedRequest, JwtPayload, AppRole } from '../middleware/auth.js';

const ACCESS_TOKEN_EXPIRY = process.env.JWT_ACCESS_EXPIRES_IN || '15m';
const REFRESH_TOKEN_EXPIRY = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

function generateAccessToken(payload: JwtPayload): string {
  const secret = process.env.JWT_ACCESS_SECRET;
  if (!secret) throw new Error('JWT_ACCESS_SECRET not configured');
  return jwt.sign(payload, secret, { expiresIn: ACCESS_TOKEN_EXPIRY });
}

function generateRefreshToken(userId: string): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) throw new Error('JWT_REFRESH_SECRET not configured');
  return jwt.sign({ userId }, secret, { expiresIn: REFRESH_TOKEN_EXPIRY });
}

function parseExpiryToMs(expiry: string): number {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000; // Default 7 days

  const value = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 7 * 24 * 60 * 60 * 1000;
  }
}

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.profile.findUnique({
      where: { email: email.toLowerCase() },
      include: { organization: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    const expiresAt = new Date(Date.now() + parseExpiryToMs(REFRESH_TOKEN_EXPIRY));
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      }
    });

    res.json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization,
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const register = async (req: Request, res: Response) => {
  try {
    const { email, password, nome } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user exists
    const existingUser = await prisma.profile.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.profile.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        nome,
        role: 'staff', // Default role for self-registration
      }
    });

    // Generate tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(user.id);

    // Store refresh token
    const expiresAt = new Date(Date.now() + parseExpiryToMs(REFRESH_TOKEN_EXPIRY));
    await prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        expiresAt,
      }
    });

    res.status(201).json({
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        organizationId: user.organizationId,
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const refresh = async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const secret = process.env.JWT_REFRESH_SECRET;
    if (!secret) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Verify token
    let decoded: { userId: string };
    try {
      decoded = jwt.verify(refreshToken, secret) as { userId: string };
    } catch {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Check if token exists in database
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        userId: decoded.userId,
        expiresAt: { gt: new Date() }
      }
    });

    if (!storedToken) {
      return res.status(401).json({ error: 'Refresh token not found or expired' });
    }

    // Get user
    const user = await prisma.profile.findUnique({
      where: { id: decoded.userId },
      include: { organization: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    // Delete old refresh token
    await prisma.refreshToken.delete({ where: { id: storedToken.id } });

    // Generate new tokens
    const payload: JwtPayload = {
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId,
    };

    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken(user.id);

    // Store new refresh token
    const expiresAt = new Date(Date.now() + parseExpiryToMs(REFRESH_TOKEN_EXPIRY));
    await prisma.refreshToken.create({
      data: {
        token: newRefreshToken,
        userId: user.id,
        expiresAt,
      }
    });

    res.json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
};

export const logout = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      // Delete specific refresh token
      await prisma.refreshToken.deleteMany({
        where: { token: refreshToken }
      });
    } else if (req.user) {
      // Delete all refresh tokens for user
      await prisma.refreshToken.deleteMany({
        where: { userId: req.user.userId }
      });
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const user = await prisma.profile.findUnique({
      where: { id: req.user.userId },
      include: { organization: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      email: user.email,
      nome: user.nome,
      avatarUrl: user.avatarUrl,
      role: user.role,
      organizationId: user.organizationId,
      organization: user.organization,
      createdAt: user.createdAt,
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

export const adminCreateUser = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    // Only super_admin and admin can create users
    if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { email, password, nome, role, organizationId } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Validate role
    const validRoles: AppRole[] = ['super_admin', 'admin', 'staff'];
    const userRole: AppRole = validRoles.includes(role) ? role : 'staff';

    // Only super_admin can create other super_admins
    if (userRole === 'super_admin' && req.user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Only super admins can create super admin users' });
    }

    // Check if user exists
    const existingUser = await prisma.profile.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Determine organization
    let targetOrgId = organizationId;
    if (req.user.role === 'admin' && !organizationId) {
      targetOrgId = req.user.organizationId;
    }

    // Verify organization exists if specified
    if (targetOrgId) {
      const org = await prisma.organization.findUnique({
        where: { id: targetOrgId }
      });
      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.profile.create({
      data: {
        email: email.toLowerCase(),
        passwordHash,
        nome,
        role: userRole,
        organizationId: targetOrgId,
      },
      include: { organization: true }
    });

    // Create user role record
    await prisma.userRole.create({
      data: {
        userId: user.id,
        role: userRole,
      }
    });

    res.status(201).json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        nome: user.nome,
        role: user.role,
        organizationId: user.organizationId,
        organization: user.organization,
      }
    });
  } catch (error) {
    console.error('Admin create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};
