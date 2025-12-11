import { Env, Subscriber } from '../types';
import { sendEmail } from '../lib/email';
import { getWelcomeEmailHTML } from '../templates/welcomeEmail';
import {
    errorResponse,
    successResponse,
    isValidEmail,
    generateId,
    getCurrentTimestamp
} from '../lib/utils';
import { verifyRequest } from '../lib/jwt';

// Generate unsubscribe token
function generateUnsubscribeToken(): string {
    return generateId();
}

// GET /api/admin/subscribers - List all subscribers (protected)
export async function getSubscribers(request: Request, env: Env): Promise<Response> {
    try {
        // Verify JWT
        const user = await verifyRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401, env);
        }

        // Parse query params for pagination, search, and sorting
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '25');
        const search = url.searchParams.get('search') || '';
        const sortBy = url.searchParams.get('sortBy') || 'subscribed_at';
        const sortOrder = url.searchParams.get('sortOrder') || 'DESC';

        const offset = (page - 1) * limit;

        // Build query with search
        let query = `SELECT * FROM subscribers WHERE subscribed = 1`;
        const params: any[] = [];

        if (search) {
            query += ` AND (email LIKE ? OR name LIKE ?)`;
            params.push(`%${search}%`, `%${search}%`);
        }

        // Add sorting
        query += ` ORDER BY ${sortBy} ${sortOrder}`;

        // Add pagination
        query += ` LIMIT ? OFFSET ?`;
        params.push(limit, offset);

        // Execute query
        const subscribers = await env.DB.prepare(query)
            .bind(...params)
            .all<Subscriber>();

        // Get total count for pagination
        let countQuery = `SELECT COUNT(*) as total FROM subscribers WHERE subscribed = 1`;
        const countParams: any[] = [];

        if (search) {
            countQuery += ` AND (email LIKE ? OR name LIKE ?)`;
            countParams.push(`%${search}%`, `%${search}%`);
        }

        const countResult = await env.DB.prepare(countQuery)
            .bind(...countParams)
            .first<{ total: number }>();

        const total = countResult?.total || 0;
        const totalPages = Math.ceil(total / limit);

        return successResponse(
            'Subscribers retrieved successfully',
            {
                subscribers: subscribers.results || [],
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages,
                },
            },
            env
        );
    } catch (error) {
        console.error('Error in getSubscribers:', error);
        return errorResponse('Internal server error', 500, env);
    }
}

// GET /api/admin/subscribers/stats - Get subscriber statistics (protected)
export async function getSubscriberStats(request: Request, env: Env): Promise<Response> {
    try {
        // Verify JWT
        const user = await verifyRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401, env);
        }

        // Total subscribers
        const totalResult = await env.DB.prepare(
            'SELECT COUNT(*) as total FROM subscribers WHERE subscribed = 1'
        ).first<{ total: number }>();

        const total = totalResult?.total || 0;

        // New subscribers this month
        const thisMonthResult = await env.DB.prepare(
            `SELECT COUNT(*) as count FROM subscribers 
       WHERE subscribed = 1 
       AND strftime('%Y-%m', subscribed_at) = strftime('%Y-%m', 'now')`
        ).first<{ count: number }>();

        const thisMonth = thisMonthResult?.count || 0;

        // Last month for growth calculation
        const lastMonthResult = await env.DB.prepare(
            `SELECT COUNT(*) as count FROM subscribers 
       WHERE subscribed = 1 
       AND strftime('%Y-%m', subscribed_at) = strftime('%Y-%m', 'now', '-1 month')`
        ).first<{ count: number }>();

        const lastMonth = lastMonthResult?.count || 0;

        // Calculate growth rate
        const growthRate = lastMonth > 0
            ? ((thisMonth - lastMonth) / lastMonth) * 100
            : thisMonth > 0 ? 100 : 0;

        // Recent subscribers (last 7 days by day)
        const recentResult = await env.DB.prepare(
            `SELECT 
         DATE(subscribed_at) as date,
         COUNT(*) as count
       FROM subscribers 
       WHERE subscribed = 1 
       AND subscribed_at >= DATE('now', '-7 days')
       GROUP BY DATE(subscribed_at)
       ORDER BY date ASC`
        ).all<{ date: string; count: number }>();

        return successResponse(
            'Stats retrieved successfully',
            {
                total,
                thisMonth,
                lastMonth,
                growthRate: Math.round(growthRate * 100) / 100,
                recentGrowth: recentResult.results || [],
            },
            env
        );
    } catch (error) {
        console.error('Error in getSubscriberStats:', error);
        return errorResponse('Internal server error', 500, env);
    }
}

// DELETE /api/admin/subscribers/:id - Delete a subscriber (protected)
export async function deleteSubscriber(request: Request, env: Env): Promise<Response> {
    try {
        // Verify JWT
        const user = await verifyRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401, env);
        }

        // Get subscriber ID from URL
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const subscriberId = pathParts[pathParts.length - 1];

        if (!subscriberId) {
            return errorResponse('Subscriber ID is required', 400, env);
        }

        // Check if subscriber exists
        const subscriber = await env.DB.prepare(
            'SELECT * FROM subscribers WHERE id = ?'
        ).bind(subscriberId).first<Subscriber>();

        if (!subscriber) {
            return errorResponse('Subscriber not found', 404, env);
        }

        // Delete subscriber
        await env.DB.prepare(
            'DELETE FROM subscribers WHERE id = ?'
        ).bind(subscriberId).run();

        return successResponse('Subscriber deleted successfully', undefined, env);
    } catch (error) {
        console.error('Error in deleteSubscriber:', error);
        return errorResponse('Internal server error', 500, env);
    }
}

// POST /api/newsletter/subscribe - Public endpoint for newsletter subscription
export async function subscribeNewsletter(request: Request, env: Env): Promise<Response> {
    try {
        // Parse request body
        const body = await request.json() as { email?: string; name?: string };
        const email = body.email?.trim().toLowerCase();
        const name = body.name?.trim();

        // Validate email
        if (!email) {
            return errorResponse('Email is required', 400, env);
        }

        if (!isValidEmail(email)) {
            return errorResponse('Invalid email format', 400, env);
        }

        // Check if already subscribed
        const existing = await env.DB.prepare(
            'SELECT * FROM subscribers WHERE email = ?'
        ).bind(email).first<Subscriber>();

        if (existing) {
            if (existing.subscribed === 1) {
                return errorResponse('Already subscribed', 400, env);
            } else {
                // Resubscribe
                await env.DB.prepare(
                    'UPDATE subscribers SET subscribed = 1, subscribed_at = ?, unsubscribed_at = NULL WHERE email = ?'
                ).bind(getCurrentTimestamp(), email).run();

                return successResponse('Subscribed successfully!', undefined, env);
            }
        }

        // Create new subscriber
        const subscriberId = generateId();
        const unsubscribeToken = generateUnsubscribeToken();

        await env.DB.prepare(
            'INSERT INTO subscribers (id, email, name, subscribed, subscribed_at, unsubscribe_token) VALUES (?, ?, ?, 1, ?, ?)'
        ).bind(subscriberId, email, name || null, getCurrentTimestamp(), unsubscribeToken).run();

        // Send welcome email
        try {
            const { html, text } = getWelcomeEmailHTML(name || undefined);
            const unsubscribeUrl = `https://${new URL(request.url).hostname}/api/newsletter/unsubscribe?token=${unsubscribeToken}`;
            
            const emailContent = {
                html: html.replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl),
                text: text.replace(/\{\{unsubscribe_url\}\}/g, unsubscribeUrl)
            };
            
            await sendEmail({
                to: email,
                subject: '¡Bienvenido a BIDXAAGUI!',
                ...emailContent
            }, env);
        } catch (emailError) {
            console.error('Error sending welcome email:', emailError);
            // No fallamos la suscripción si hay un error en el correo
        }

        return successResponse('¡Gracias por suscribirte! Revisa tu correo para confirmar.', undefined, env);
    } catch (error) {
        console.error('Error in subscribeNewsletter:', error);
        return errorResponse('Internal server error', 500, env);
    }
}

// POST /api/newsletter/unsubscribe - Unsubscribe from newsletter
export async function unsubscribeNewsletter(request: Request, env: Env): Promise<Response> {
    try {
        // Parse request body
        const body = await request.json() as { token?: string };
        const token = body.token?.trim();

        if (!token) {
            return errorResponse('Unsubscribe token is required', 400, env);
        }

        // Find subscriber by token
        const subscriber = await env.DB.prepare(
            'SELECT * FROM subscribers WHERE unsubscribe_token = ?'
        ).bind(token).first<Subscriber>();

        if (!subscriber) {
            return errorResponse('Invalid unsubscribe token', 404, env);
        }

        // Unsubscribe (soft delete)
        await env.DB.prepare(
            'UPDATE subscribers SET subscribed = 0, unsubscribed_at = ? WHERE id = ?'
        ).bind(getCurrentTimestamp(), subscriber.id).run();

        return successResponse('Unsubscribed successfully', undefined, env);
    } catch (error) {
        console.error('Error in unsubscribeNewsletter:', error);
        return errorResponse('Internal server error', 500, env);
    }
}

// GET /api/admin/subscribers/export - Export subscribers to CSV (protected)
export async function exportSubscribers(request: Request, env: Env): Promise<Response> {
    try {
        // Verify JWT
        const user = await verifyRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401, env);
        }

        // Get all active subscribers
        const subscribers = await env.DB.prepare(
            'SELECT email, name, subscribed_at FROM subscribers WHERE subscribed = 1 ORDER BY subscribed_at DESC'
        ).all<{ email: string; name: string | null; subscribed_at: string }>();

        // Generate CSV
        let csv = 'Email,Name,Subscribed At\n';

        for (const sub of subscribers.results || []) {
            const name = sub.name || '';
            const date = new Date(sub.subscribed_at).toISOString();
            csv += `${sub.email},"${name}",${date}\n`;
        }

        // Return CSV with proper headers
        return new Response(csv, {
            status: 200,
            headers: {
                'Content-Type': 'text/csv',
                'Content-Disposition': `attachment; filename="subscribers-${new Date().toISOString().split('T')[0]}.csv"`,
                'Access-Control-Allow-Origin': env.ENVIRONMENT === 'production'
                    ? 'https://admin.bidxaagui.com'
                    : '*',
            },
        });
    } catch (error) {
        console.error('Error in exportSubscribers:', error);
        return errorResponse('Internal server error', 500, env);
    }
}
