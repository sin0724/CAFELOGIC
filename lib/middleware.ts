import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, JWTPayload } from './auth';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export function withAuth(
  handler: (req: AuthenticatedRequest) => Promise<NextResponse>,
  allowedRoles: ('admin' | 'reviewer')[] = ['admin', 'reviewer']
) {
  return async (req: NextRequest): Promise<NextResponse> => {
    const token = req.cookies.get('token')?.value || 
                  req.headers.get('authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ 
        error: 'Invalid token',
        message: 'Token verification failed. Please log in again.' 
      }, { status: 401 });
    }

    if (!allowedRoles.includes(payload.role)) {
      return NextResponse.json({ 
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}, but got: ${payload.role}`,
        userRole: payload.role,
        requiredRoles: allowedRoles
      }, { status: 403 });
    }

    const authReq = req as AuthenticatedRequest;
    authReq.user = payload;
    return handler(authReq);
  };
}

export function withAdmin(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withAuth(handler, ['admin']);
}

export function withReviewer(handler: (req: AuthenticatedRequest) => Promise<NextResponse>) {
  return withAuth(handler, ['reviewer']);
}

