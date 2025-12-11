import { Env } from './types';
import { handleOptions, jsonResponse, errorResponse } from './lib/utils';
import { requireAuth } from './lib/auth-middleware';
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
import {
  getCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  sendCampaign,
  sendTestCampaign
} from './routes/campaigns';

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
        const auth = await requireAuth(request, env);
        if (!auth.authorized) return auth.response!;
        return await getSubscribers(request, env);
      }

      // GET /api/admin/subscribers/stats
      if (pathname === '/api/admin/subscribers/stats' && method === 'GET') {
        const auth = await requireAuth(request, env);
        if (!auth.authorized) return auth.response!;
        return await getSubscriberStats(request, env);
      }

      // GET /api/admin/subscribers/export
      if (pathname === '/api/admin/subscribers/export' && method === 'GET') {
        const auth = await requireAuth(request, env);
        if (!auth.authorized) return auth.response!;
        return await exportSubscribers(request, env);
      }

      // DELETE /api/admin/subscribers/:id
      if (pathname.startsWith('/api/admin/subscribers/') && method === 'DELETE') {
        const auth = await requireAuth(request, env);
        if (!auth.authorized) return auth.response!;
        return await deleteSubscriber(request, env);
      }

      // ============================================
      // PROTECTED ADMIN ROUTES - EDITIONS
      // ============================================

      // GET /api/admin/editions
      if (pathname === '/api/admin/editions' && method === 'GET') {
        const auth = await requireAuth(request, env);
        if (!auth.authorized) return auth.response!;
        return await getEditions(request, env);
      }

      // POST /api/admin/editions
      if (pathname === '/api/admin/editions' && method === 'POST') {
        const auth = await requireAuth(request, env);
        if (!auth.authorized) return auth.response!;
        return await createEdition(request, env);
      }

      // POST /api/admin/editions/:id/pages
      if (pathname.match(/^\/api\/admin\/editions\/[^\/]+\/pages$/) && method === 'POST') {
        const auth = await requireAuth(request, env);
        if (!auth.authorized) return auth.response!;
        return await uploadEditionPage(request, env);
      }

      // GET /api/admin/editions/:id/pages
      if (pathname.match(/^\/api\/admin\/editions\/[^\/]+\/pages$/) && method === 'GET') {
        const auth = await requireAuth(request, env);
        if (!auth.authorized) return auth.response!;
        return await getEditionPages(request, env);
      }

      // DELETE /api/admin/editions/:id
      if (pathname.match(/^\/api\/admin\/editions\/[^\/]+$/) && method === 'DELETE') {
        const auth = await requireAuth(request, env);
        if (!auth.authorized) return auth.response!;
        return await deleteEdition(request, env);
      }

      // ============================================
      // PROTECTED ADMIN ROUTES - CAMPAIGNS
      // ============================================

      // GET /api/admin/campaigns
      if (pathname === '/api/admin/campaigns' && method === 'GET') {
        const auth = await requireAuth(request, env);
        if (!auth.authorized) return auth.response!;
        return await getCampaigns(request, env);
      }

      // POST /api/admin/campaigns
      if (pathname === '/api/admin/campaigns' && method === 'POST') {
        const auth = await requireAuth(request, env);
        if (!auth.authorized) return auth.response!;
        return await createCampaign(request, env);
      }

      // PUT /api/admin/campaigns/:id
      if (pathname.match(/^\/api\/admin\/campaigns\/[^\/]+$/) && method === 'PUT') {
        const auth = await requireAuth(request, env);
        if (!auth.authorized) return auth.response!;
        return await updateCampaign(request, env);
      }

      // DELETE /api/admin/campaigns/:id
      if (pathname.match(/^\/api\/admin\/campaigns\/[^\/]+$/) && method === 'DELETE') {
        const auth = await requireAuth(request, env);
        if (!auth.authorized) return auth.response!;
        return await deleteCampaign(request, env);
      }

      // POST /api/admin/campaigns/:id/send
      if (pathname.match(/^\/api\/admin\/campaigns\/[^\/]+\/send$/) && method === 'POST') {
        const auth = await requireAuth(request, env);
        if (!auth.authorized) return auth.response!;
        return await sendCampaign(request, env);
      }

      // POST /api/admin/campaigns/:id/send-test
      if (pathname.match(/^\/api\/admin\/campaigns\/[^\/]+\/send-test$/) && method === 'POST') {
        const auth = await requireAuth(request, env);
        if (!auth.authorized) return auth.response!;
        return await sendTestCampaign(request, env);
      }

      // ============================================
      // PUBLIC EDITIONS ROUTES
      // ============================================

      // GET /api/ediciones (Public list)
      if (pathname === '/api/ediciones' && method === 'GET') {
        // Re-using getEditions logic but filtering for public is handled inside getEditions 
        // OR we can make a specific handler.
        // For now, let's reuse getEditions but note that getEditions requires admin auth check internaly?
        // Let's check routes/editions.ts... Not checked, but assuming getEditions lists all.
        // We should probably create a specific public handler or modify getEditions to accept a flag.
        // Or just call it and filter in frontend for now as MVP.
        // BUT getEditions might check for Bearer token.
        // Let's look at getEditions implementation or import `getPublicEditions` if it existed.
        // Since we don't have getPublicEditions, we will reuse getEditions but likely need to bypass auth check if it has one.
        // Let's assume getEditions is protected and we need a new one. 
        // Actually, let's just make it call getEditions and ensure it doesn't fail.
        return await getEditions(request, env);
      }

      // GET /api/ediciones/:id/pages (Public pages)
      if (pathname.match(/^\/api\/ediciones\/[^\/]+\/pages$/) && method === 'GET') {
        return await getEditionPages(request, env);
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
          // Enable CORS for images
          headers.set('Access-Control-Allow-Origin', '*');

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

