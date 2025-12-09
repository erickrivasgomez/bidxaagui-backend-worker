import jwt from '@tsndr/cloudflare-worker-jwt';
import { Env, JWTPayload } from '../types';

// Generate JWT token
export async function generateJWT(
    userId: string,
    email: string,
    env: Env
): Promise<string> {
    const expirationDays = parseInt(env.JWT_EXPIRATION_DAYS || '7');
    const expirationSeconds = expirationDays * 24 * 60 * 60;

    const payload: JWTPayload = {
        userId,
        email,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + expirationSeconds,
    };

    return await jwt.sign(payload, env.JWT_SECRET);
}

// Verify JWT token
export async function verifyJWT(
    token: string,
    env: Env
): Promise<JWTPayload | null> {
    try {
        if (!env.JWT_SECRET) {
            console.error('CRITICAL: JWT_SECRET is not defined in environment!');
            return null;
        }

        const isValid = await jwt.verify(token, env.JWT_SECRET);

        if (!isValid) {
            console.error('JWT Verification failed: Invalid signature or secret mismatch');
            return null;
        }

        const decoded = jwt.decode(token);
        return decoded.payload as JWTPayload;
    } catch (error) {
        console.error('JWT verification error:', error);
        return null;
    }
}

// Extract token from Authorization header
export function extractToken(request: Request): string | null {
    const authHeader = request.headers.get('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No valid Authorization header found');
        return null;
    }

    return authHeader.substring(7); // Remove 'Bearer ' prefix
}

// Middleware to verify JWT from request
export async function verifyRequest(
    request: Request,
    env: Env
): Promise<JWTPayload | null> {
    const token = extractToken(request);

    if (!token) {
        return null;
    }

    return await verifyJWT(token, env);
}
