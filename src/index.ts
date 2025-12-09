import { Env } from './types';
import { handleOptions, jsonResponse, errorResponse } from './lib/utils';
import { requestMagicLink, verifyMagicLink } from './routes/auth';
import {
  getSubscribers,
  getSubscriberStats,
  deleteSubscriber,
  subscribeNewsletter,
  unsubscribeNewsletter,
  exportSubscribers,
} from './routes/subscribers';

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return handleOptions(env);
    }

    try {
      // ============================================
      // HEALTH CHECK
      // ============================================
      if (pathname === '/api/health') {
        return jsonResponse(
          {
            status: 'ok',
            message: 'BIDXAAGUI API is running',
            environment: env.ENVIRONMENT || 'development',
            timestamp: new Date().toISOString(),
          },
          200,
          env
        );
      }

      // ============================================
      // AUTHENTICATION ROUTES
      // ============================================

      // POST /api/auth/magic-link/request
      if (pathname === '/api/auth/magic-link/request' && method === 'POST') {
        return await requestMagicLink(request, env);
      }

      // GET /api/auth/magic-link/verify
      if (pathname === '/api/auth/magic-link/verify' && method === 'GET') {
        return await verifyMagicLink(request, env);
      }

      // ============================================
      // PUBLIC NEWSLETTER ROUTES
      // ============================================

      // POST /api/newsletter/subscribe
      if (pathname === '/api/newsletter/subscribe' && method === 'POST') {
        return await subscribeNewsletter(request, env);
      }

      // POST /api/newsletter/unsubscribe
      if (pathname === '/api/newsletter/unsubscribe' && method === 'POST') {
        return await unsubscribeNewsletter(request, env);
      }

      // ============================================
      // PROTECTED ADMIN ROUTES - SUBSCRIBERS
      // ============================================

      // GET /api/admin/subscribers
      if (pathname === '/api/admin/subscribers' && method === 'GET') {
        return await getSubscribers(request, env);
      }

      // GET /api/admin/subscribers/stats
      if (pathname === '/api/admin/subscribers/stats' && method === 'GET') {
        return await getSubscriberStats(request, env);
      }

      // GET /api/admin/subscribers/export
      if (pathname === '/api/admin/subscribers/export' && method === 'GET') {
        return await exportSubscribers(request, env);
      }

      // DELETE /api/admin/subscribers/:id
      if (pathname.startsWith('/api/admin/subscribers/') && method === 'DELETE') {
        return await deleteSubscriber(request, env);
      }

      // ============================================
      // FUTURE ROUTES
      // ============================================
      // Ediciones endpoints will be added here

      // ============================================
      // 404 - Route not found
      // ============================================
      return errorResponse('Route not found', 404, env);

    } catch (error) {
      console.error('Unhandled error:', error);
      return errorResponse('Internal server error', 500, env);
    }
  },
};

