import { Env } from '../types';

// CORS headers
export const corsHeaders = (env: Env) => ({
    'Access-Control-Allow-Origin': env.ENVIRONMENT === 'production'
        ? 'https://admin.bidxaagui.com'
        : '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
});

// Handle OPTIONS (preflight) requests
export function handleOptions(env: Env): Response {
    return new Response(null, {
        status: 204,
        headers: corsHeaders(env),
    });
}

// JSON response helper
export function jsonResponse<T>(
    data: T,
    status: number = 200,
    env: Env
): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            ...corsHeaders(env),
        },
    });
}

// Success response
export function successResponse<T>(
    message: string,
    data?: T,
    env?: Env
): Response {
    return jsonResponse(
        {
            success: true,
            message,
            data,
        },
        200,
        env!
    );
}

// Error response
export function errorResponse(
    message: string,
    status: number = 400,
    env?: Env
): Response {
    return jsonResponse(
        {
            success: false,
            error: message,
        },
        status,
        env!
    );
}

// Validate email format
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Generate unique ID (UUID v4-like)
export function generateId(): string {
    return crypto.randomUUID();
}

// Get current timestamp in ISO format
export function getCurrentTimestamp(): string {
    return new Date().toISOString();
}

// Add minutes to current time
export function addMinutes(minutes: number): string {
    const date = new Date();
    date.setMinutes(date.getMinutes() + minutes);
    return date.toISOString();
}

// Check if timestamp is expired
export function isExpired(timestamp: string): boolean {
    return new Date(timestamp) < new Date();
}
