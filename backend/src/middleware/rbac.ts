import { Response, NextFunction } from 'express';
import { AuthenticatedRequest, AppRole } from './auth.js';

// Role hierarchy: super_admin > admin > staff
const roleHierarchy: Record<AppRole, number> = {
  super_admin: 3,
  admin: 2,
  staff: 1,
};

export const requireRole = (...allowedRoles: AppRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userRole = req.user.role;

    // Check if user's role is in allowed roles
    if (allowedRoles.includes(userRole)) {
      return next();
    }

    // Check if user has a higher role than any of the allowed roles
    const userRoleLevel = roleHierarchy[userRole];
    const hasHigherRole = allowedRoles.some(
      role => userRoleLevel > roleHierarchy[role]
    );

    if (hasHigherRole) {
      return next();
    }

    return res.status(403).json({
      error: 'Access denied',
      message: `Required role: ${allowedRoles.join(' or ')}`
    });
  };
};

export const requireSuperAdmin = requireRole('super_admin');
export const requireAdmin = requireRole('super_admin', 'admin');
export const requireStaff = requireRole('super_admin', 'admin', 'staff');
