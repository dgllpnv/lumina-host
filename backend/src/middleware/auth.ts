import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../index.js';

export type AppRole = 'super_admin' | 'admin' | 'staff';

export interface JwtPayload {
  userId: string;
  email: string;
  role: AppRole;
  organizationId: string | null;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
  effectiveOrgId?: string;
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      console.error('JWT_ACCESS_SECRET not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const decoded = jwt.verify(token, secret) as JwtPayload;

    // Verify user still exists
    const user = await prisma.profile.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, organizationId: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role as AppRole,
      organizationId: user.organizationId,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ error: 'Token expired' });
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication error' });
  }
};

export const optionalAuthMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_ACCESS_SECRET;

    if (!secret) {
      return next();
    }

    try {
      const decoded = jwt.verify(token, secret) as JwtPayload;
      req.user = decoded;
    } catch {
      // Token invalid, continue without user
    }

    next();
  } catch (error) {
    next();
  }
};
