import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'linxi-access-secret-dev';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'linxi-refresh-secret-dev';
const ACCESS_EXPIRES = '2h';
const REFRESH_EXPIRES = '7d';

export interface TokenPayload {
  userId: number;
  username: string;
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, ACCESS_SECRET) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, REFRESH_SECRET) as TokenPayload;
}

export function signTokenPair(payload: TokenPayload) {
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    expiresIn: 7200,
  };
}
