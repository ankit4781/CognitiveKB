import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Authentication token is missing. Please log in.' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'kb_assistant_secret_token_12345';

  jwt.verify(token, jwtSecret, (err, decoded: any) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Authentication session expired. Please log in again.' });
      }
      return res.status(403).json({ message: 'Invalid authentication token.' });
    }

    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    next();
  });
};
