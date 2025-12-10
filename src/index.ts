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
import {
  getEditions,
  createEdition,
  deleteEdition,
  uploadEditionPage,
  getEditionPages
} from './routes/editions';

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
      // PROTECTED ADMIN ROUTES - EDITIONS
      // ============================================

      // GET /api/admin/editions
      if (pathname === '/api/admin/editions' && method === 'GET') {
        return await getEditions(request, env);
      }

      // POST /api/admin/editions
      if (pathname === '/api/admin/editions' && method === 'POST') {
        return await createEdition(request, env);
      }

      // POST /api/admin/editions/:id/pages
      if (pathname.match(/^\/api\/admin\/editions\/[^\/]+\/pages$/) && method === 'POST') {
        return await uploadEditionPage(request, env);
      }

      // GET /api/admin/editions/:id/pages
      if (pathname.match(/^\/api\/admin\/editions\/[^\/]+\/pages$/) && method === 'GET') {
        return await getEditionPages(request, env);
      }

      // DELETE /api/admin/editions/:id
      if (pathname.match(/^\/api\/admin\/editions\/[^\/]+$/) && method === 'DELETE') {
        return await deleteEdition(request, env);
      }

      // GET /api/images/:key (Serve R2 images)
      // Supports slashes in key, e.g. /api/images/editions/123/page_1.webp
      if (pathname.startsWith('/api/images/')) {
        const key = pathname.replace('/api/images/', '');
        try {
          const object = await env.BUCKET.get(key);
          if (!object) {
            return errorResponse('Image not found', 404, env);
          }

          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set('etag', object.httpEtag);
          // Aggressive caching
          headers.set('Cache-Control', 'public, max-age=31536000');

          return new Response(object.body, {
            headers,
          });
        } catch (e) {
          console.error('Error fetching image:', e);
          return errorResponse('Error serving image', 500, env);
        }
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

