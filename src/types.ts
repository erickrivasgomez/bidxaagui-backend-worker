// Environment interface for Cloudflare Worker
export interface Env {
    // Environment variables
    ENVIRONMENT: 'development' | 'production';
    RESEND_FROM_EMAIL: string;
    ADMIN_URL: string;
    FRONTEND_URL: string;
    MAGIC_LINK_EXPIRATION_MINUTES: string;
    JWT_EXPIRATION_DAYS: string;

    // Secrets (set via wrangler secret put)
    RESEND_API_KEY: string;
    JWT_SECRET: string;

    // D1 Database
    DB: D1Database;
}

// Database types
export interface AdminUser {
    id: string;
    email: string;
    name?: string;
    created_at: string;
    last_login?: string;
}

export interface MagicLinkToken {
    token: string;
    user_id: string;
    expires_at: string;
    used: number; // SQLite uses 0/1 for boolean
    created_at: string;
}

export interface Subscriber {
    id: string;
    email: string;
    name?: string;
    subscribed: number;
    subscribed_at: string;
    unsubscribed_at?: string;
    unsubscribe_token?: string;
}

// JWT Payload
export interface JWTPayload {
    userId: string;
    email: string;
    iat: number;
    exp: number;
}

// API Response types
export interface APIResponse<T = any> {
    success: boolean;
    message?: string;
    data?: T;
    error?: string;
}
