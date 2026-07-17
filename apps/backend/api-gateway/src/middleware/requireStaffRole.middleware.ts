import { Request, Response, NextFunction } from 'express';

/**
 * Restricts a route (mounted after {@link ../middleware/auth.middleware}, so `req.user` is
 * already set) to specific staff `userType`s — e.g. the live-tracking SSE stream, which mirrors
 * telemetry-service's own `@PreAuthorize("hasAnyRole('ADMIN','MOT')")` on `/api/devices` and
 * `/api/live/**`'s intended consumers.
 */
export function requireStaffRole(allowed: string[]) {
  const allowedLower = allowed.map((role) => role.toLowerCase());
  return (req: Request, res: Response, next: NextFunction): void => {
    const userType = req.user?.userType?.toLowerCase();
    if (!userType || !allowedLower.includes(userType)) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Insufficient role for this resource' } });
      return;
    }
    next();
  };
}
