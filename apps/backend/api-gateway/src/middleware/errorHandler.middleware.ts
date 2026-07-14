import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  // req.log is the per-request child logger from pino-http (carries the requestId);
  // fall back to the base logger if the error fires before it is attached.
  const log = (req as Request & { log?: typeof logger }).log ?? logger;
  log.error(
    { err, requestId: (req as Request & { id?: string }).id, method: req.method, path: req.path },
    'Unhandled error',
  );
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
}
