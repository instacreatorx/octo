import jwt from 'jsonwebtoken';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';
const TOKEN_EXPIRY = '7d'; // 7 days

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: TokenPayload): string {
  const token = jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  // OpenAI-style API token format: sk-<base64-encoded-jwt>
  const base64Token = Buffer.from(token).toString('base64');
  return `sk-${base64Token}`;
}

export function verifyToken(tokenString: string): TokenPayload | null {
  try {
    // Remove sk- prefix if present
    const cleanToken = tokenString.startsWith('sk-') 
      ? tokenString.slice(3) 
      : tokenString;
    
    // Decode base64
    const jwtToken = Buffer.from(cleanToken, 'base64').toString('utf-8');
    
    // Verify JWT
    const decoded = jwt.verify(jwtToken, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  // Support both "Bearer sk-..." and "sk-..." formats
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7);
  }
  if (authHeader.startsWith('sk-')) {
    return authHeader;
  }
  return null;
}

