import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import pool from './db';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface JWTPayload {
  userId: string;
  username: string;
  role: 'admin' | 'reviewer';
}

export async function verifyPassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export async function authenticateUser(username: string, password: string): Promise<{ user: any; role: 'admin' | 'reviewer' } | null> {
  // 관리자 계정 확인
  const adminResult = await pool.query(
    'SELECT id, username, password_hash FROM admins WHERE username = $1',
    [username]
  );

  if (adminResult.rows.length > 0) {
    const admin = adminResult.rows[0];
    const isValid = await verifyPassword(password, admin.password_hash);
    if (isValid) {
      return { user: admin, role: 'admin' };
    }
  }

  // 리뷰어 계정 확인
  const reviewerResult = await pool.query(
    'SELECT id, username, password_hash, nickname, unit_price FROM reviewers WHERE username = $1',
    [username]
  );

  if (reviewerResult.rows.length > 0) {
    const reviewer = reviewerResult.rows[0];
    const isValid = await verifyPassword(password, reviewer.password_hash);
    if (isValid) {
      return { user: reviewer, role: 'reviewer' };
    }
  }

  return null;
}

