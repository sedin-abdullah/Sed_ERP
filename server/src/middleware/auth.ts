import { NextFunction, Request, Response } from 'express';
import { IUser, Permission, Role, User } from '../models/User';
import { verifyToken } from '../utils/token';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

/** Verifies the Bearer token and loads req.user; 401 otherwise. */
export async function protect(req: Request, res: Response, next: NextFunction): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required' });
    return;
  }
  try {
    const payload = verifyToken(header.split(' ')[1]);
    const user = await User.findById(payload.sub);
    if (!user || !user.active) {
      res.status(401).json({ success: false, message: 'Account not found or disabled' });
      return;
    }
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
}

/** Restrict to specific roles (admin is implicitly allowed everywhere). */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || (req.user.role !== 'admin' && !roles.includes(req.user.role))) {
      res.status(403).json({ success: false, message: 'Insufficient role' });
      return;
    }
    next();
  };
}

/** Require a granular permission (admins bypass). */
export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Authentication required' });
      return;
    }
    if (req.user.role === 'admin' || req.user.permissions.includes(permission)) {
      next();
      return;
    }
    res.status(403).json({ success: false, message: `Missing permission: ${permission}` });
  };
}
