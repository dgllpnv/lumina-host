import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import { prisma } from '../index.js';

/**
 * Middleware to determine the effective organization ID for multi-tenant queries.
 *
 * - Super admins can specify X-Organization-Id header to access any org
 * - Admin/Staff users can only access their own organization
 */
export const orgFilterMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { role, organizationId } = req.user;

  // Super admin can access any organization via header
  if (role === 'super_admin') {
    const headerOrgId = req.headers['x-organization-id'] as string;

    if (headerOrgId) {
      // Verify the organization exists
      const org = await prisma.organization.findUnique({
        where: { id: headerOrgId },
        select: { id: true }
      });

      if (!org) {
        return res.status(404).json({ error: 'Organization not found' });
      }

      req.effectiveOrgId = headerOrgId;
    } else {
      // Super admin without header - allow access but may need to filter differently
      req.effectiveOrgId = undefined;
    }
  } else {
    // Regular users can only access their own organization
    if (!organizationId) {
      return res.status(403).json({
        error: 'No organization assigned',
        message: 'Please contact an administrator to assign you to an organization'
      });
    }
    req.effectiveOrgId = organizationId;
  }

  next();
};

/**
 * Middleware that requires an organization context (effectiveOrgId must be set)
 */
export const requireOrgContext = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.effectiveOrgId) {
    return res.status(400).json({
      error: 'Organization context required',
      message: 'Please specify X-Organization-Id header'
    });
  }
  next();
};
