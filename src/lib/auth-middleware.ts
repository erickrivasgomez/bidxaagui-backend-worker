import { Env } from '../types';
import { verifyRequest } from './jwt';
import { errorResponse } from './utils';

/**
 * Middleware to verify authentication for admin routes
 * Returns the JWT payload if valid, or null if invalid
 */
export async function requireAuth(request: Request, env: Env) {
    const payload = await verifyRequest(request, env);

    if (!payload) {
        return {
            authorized: false,
            payload: null,
            response: errorResponse('Unauthorized. Please login.', 401, env)
        };
    }

    return {
        authorized: true,
        payload,
        response: null
    };
}
