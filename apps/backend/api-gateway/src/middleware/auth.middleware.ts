import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../auth/tokenVerifier';

export async function authMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: { code: 'MISSING_TOKEN', message: 'Authorization header required' } });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = await verifyAccessToken(token);

    if (decoded.app_metadata?.account_status === 'suspended') {
      res.status(403).json({ error: { code: 'ACCOUNT_SUSPENDED', message: 'Account is suspended' } });
      return;
    }

    req.user = {
      userId: decoded.sub,
      email: decoded.email,
      userType: decoded.app_metadata?.user_type ?? 'unknown',
      accountStatus: decoded.app_metadata?.account_status ?? 'unknown',
    };

    // Forward user info to downstream services via headers
    req.headers['x-user-id'] = req.user.userId;
    req.headers['x-user-type'] = req.user.userType;
    req.headers['x-user-email'] = req.user.email;

    next();
  } catch (err) {
    res.status(401).json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' } });
  }
}
