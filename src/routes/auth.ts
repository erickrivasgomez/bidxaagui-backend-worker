import { nanoid } from 'nanoid';
import { Env, AdminUser, MagicLinkToken } from '../types';
import {
    errorResponse,
    successResponse,
    isValidEmail,
    addMinutes,
    getCurrentTimestamp,
    isExpired
} from '../lib/utils';
import { generateJWT } from '../lib/jwt';
import { sendEmail } from '../lib/email';
import { getMagicLinkEmailHTML, getMagicLinkEmailText } from '../templates/magicLinkEmail';

// POST /api/auth/magic-link/request
export async function requestMagicLink(request: Request, env: Env): Promise<Response> {
    try {
        console.log('=== Magic Link Request Started ===');

        // Parse request body
        const body = await request.json() as { email?: string };
        const email = body.email?.trim().toLowerCase();
        console.log('Email received:', email);

        // Validate email
        if (!email) {
            console.log('Error: Email is missing');
            return errorResponse('Email is required', 400, env);
        }

        if (!isValidEmail(email)) {
            console.log('Error: Invalid email format');
            return errorResponse('Invalid email format', 400, env);
        }

        // Check if user exists in admin_users
        console.log('Checking database for email:', email);
        const user = await env.DB.prepare(
            'SELECT * FROM admin_users WHERE email = ?'
        ).bind(email).first<AdminUser>();

        if (!user) {
            console.log('Error: Email not found in database');
            return errorResponse('Email not found. Please contact administrator.', 404, env);
        }

        console.log('User found:', user.id, user.email);

        // Generate magic link token
        const token = nanoid(32); // 32-character random token
        const expirationMinutes = parseInt(env.MAGIC_LINK_EXPIRATION_MINUTES || '15');
        const expiresAt = addMinutes(expirationMinutes);
        console.log('Token generated, expires at:', expiresAt);

        // Store token in database
        console.log('Storing token in database...');
        await env.DB.prepare(
            'INSERT INTO magic_link_tokens (token, user_id, expires_at, used, created_at) VALUES (?, ?, ?, 0, ?)'
        ).bind(token, user.id, expiresAt, getCurrentTimestamp()).run();
        console.log('Token stored successfully');

        // Create magic link URL
        const magicLink = `${env.ADMIN_URL}/auth/verify?token=${token}`;
        console.log('Magic link created:', magicLink);

        // Send email
        console.log('Preparing to send email...');
        const emailHtml = getMagicLinkEmailHTML(magicLink, expirationMinutes);
        const emailText = getMagicLinkEmailText(magicLink, expirationMinutes);

        console.log('Calling Resend API...');
        const emailResult = await sendEmail(
            {
                to: email,
                subject: 'Tu enlace de acceso - BIDXAAGUI',
                html: emailHtml,
                text: emailText,
            },
            env
        );

        if (!emailResult.success) {
            console.error('Failed to send email:', emailResult.error);
            return errorResponse('Failed to send email. Please try again.', 500, env);
        }

        console.log('Email sent successfully!');

        // Success response
        return successResponse(
            'Magic link sent! Check your email.',
            undefined,
            env
        );

    } catch (error) {
        console.error('=== ERROR in requestMagicLink ===');
        console.error('Error type:', (error as any)?.constructor?.name);
        console.error('Error message:', (error as Error)?.message);
        console.error('Full error:', error);
        return errorResponse('Internal server error', 500, env);
    }
}

// GET /api/auth/magic-link/verify?token=xxx
export async function verifyMagicLink(request: Request, env: Env): Promise<Response> {
    try {
        // Get token from query params
        const url = new URL(request.url);
        const verifyToken = url.searchParams.get('token');

        if (!verifyToken) {
            return errorResponse('Token is required', 400, env);
        }

        // Get token from database
        const magicToken = await env.DB.prepare(
            'SELECT * FROM magic_link_tokens WHERE token = ?'
        ).bind(verifyToken).first<MagicLinkToken>();

        if (!magicToken) {
            return errorResponse('Invalid magic link', 404, env);
        }

        // Check if already used
        if (magicToken.used === 1) {
            return errorResponse('Magic link already used. Please request a new one.', 410, env);
        }

        // Check if expired
        if (isExpired(magicToken.expires_at)) {
            return errorResponse('Magic link expired. Please request a new one.', 410, env);
        }

        // Get user
        const verifyUser = await env.DB.prepare(
            'SELECT * FROM admin_users WHERE id = ?'
        ).bind(magicToken.user_id).first<AdminUser>();

        if (!verifyUser) {
            return errorResponse('User not found', 404, env);
        }

        // Mark token as used
        await env.DB.prepare(
            'UPDATE magic_link_tokens SET used = 1 WHERE token = ?'
        ).bind(verifyToken).run();

        // Update last login
        await env.DB.prepare(
            'UPDATE admin_users SET last_login = ? WHERE id = ?'
        ).bind(getCurrentTimestamp(), verifyUser.id).run();

        // Generate JWT
        const jwtToken = await generateJWT(verifyUser.id, verifyUser.email, env);

        // Success response with token and user data
        return successResponse(
            'Login successful',
            {
                token: jwtToken,
                user: {
                    id: verifyUser.id,
                    email: verifyUser.email,
                    name: verifyUser.name,
                },
            },
            env
        );

    } catch (error) {
        console.error('Error in verifyMagicLink:', error);
        return errorResponse('Internal server error', 500, env);
    }
}
