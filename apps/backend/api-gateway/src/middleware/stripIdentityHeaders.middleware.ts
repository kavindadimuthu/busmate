import { Request, Response, NextFunction } from 'express';

/**
 * Identity headers are set by authMiddleware from a verified token and nowhere else (INC-016).
 * A client that sends its own x-user-id / x-user-type / x-user-email on a route that does not
 * run authMiddleware would otherwise have them forwarded untouched to a service that trusts them.
 */
export function stripClientIdentityHeaders(req: Request, _res: Response, next: NextFunction): void {
  for (const name of Object.keys(req.headers)) {
    if (name.startsWith('x-user-')) {
      delete req.headers[name];
    }
  }
  next();
}
