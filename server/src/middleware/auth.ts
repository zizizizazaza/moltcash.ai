import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import prisma from '../db.js';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string | null;
    role: string;
  };
}

export function authRequired(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as { userId: string };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
}

export async function authWithUser(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, config.jwt.secret) as { userId: string };
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true },
    });
    if (!user) {
      res.status(401).json({ error: 'User not found' });
      return;
    }
    req.userId = user.id;
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
    return;
  }
}

/** Optional auth - sets userId if token present, but doesn't block */
export function authOptional(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const payload = jwt.verify(token, config.jwt.secret) as { userId: string };
      req.userId = payload.userId;
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}
