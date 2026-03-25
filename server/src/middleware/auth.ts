import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import prisma from '../db.js';

export interface AuthRequest extends Request {
  userId?: string;
  user?: {
    id: string;
    email: string | null;
    role: string;
  };
}

const PRIVY_APP_ID = process.env.PRIVY_APP_ID || 'cmmn4pr2v05400cjmn7csjfoc';

const client = jwksClient({
  jwksUri: `https://auth.privy.io/api/v1/apps/${PRIVY_APP_ID}/jwks.json`,
});

function getKey(header: jwt.JwtHeader, callback: jwt.SigningKeyCallback) {
  client.getSigningKey(header.kid, function (err, key) {
    if (err) {
      callback(err, undefined);
      return;
    }
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export function verifyToken(token: string): Promise<any> {
  return new Promise((resolve, reject) => {
    jwt.verify(token, getKey, { issuer: 'privy.io' }, (err, decoded) => {
      if (err) return reject(err);
      resolve(decoded);
    });
  });
}

export async function authRequired(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization token' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = await verifyToken(token);
    req.userId = payload.userId || payload.sub?.replace('did:privy:', '');
    next();
  } catch (err) {
    console.error('Token validation failed:', err);
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
    const payload = await verifyToken(token);
    const userId = payload.userId || payload.sub?.replace('did:privy:', '');
    
    // Privy might not have pushed the user to our DB yet if they literally just signed up.
    // If not found, we can optionally auto-create them, or let auth fail.
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, role: true },
    });
    
    if (!user) {
      res.status(401).json({ error: 'User not found in local database' });
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
export async function authOptional(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (header?.startsWith('Bearer ')) {
    const token = header.slice(7);
    try {
      const payload = await verifyToken(token);
      req.userId = payload.userId || payload.sub?.replace('did:privy:', '');
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}
