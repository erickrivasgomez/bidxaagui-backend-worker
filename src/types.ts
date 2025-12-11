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

    // R2 Bucket
    BUCKET: R2Bucket;
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

export interface Edicion {
    id: string;
    titulo: string;
    descripcion?: string;
    cover_url?: string;
    fecha?: string;
    publicada: number; // 0 or 1
    created_at: string;
    updated_at: string;
}

export interface Pagina {
    id: string;
    edicion_id: string;
    numero: number;
    imagen_url: string;
    created_at: string;
}

// Campaign interface
export interface Campaign {
    id: string;
    subject: string;
    preview_text?: string;
    content: string; // HTML content
    status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';
    sent_at?: string;
    total_recipients: number;
    successful_sends: number;
    failed_sends: number;
    created_at: string;
    updated_at: string;
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
