import { Env } from '../types';
import {
    errorResponse,
    successResponse,
    generateId,
    getCurrentTimestamp
} from '../lib/utils';
import { verifyRequest } from '../lib/jwt';

// GET /api/admin/suppliers - List all suppliers (protected)
export async function getSuppliers(request: Request, env: Env): Promise<Response> {
    try {
        // Verify JWT
        const user = await verifyRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401, env);
        }

        // Parse query params for pagination, search, and city filter
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '25');
        const search = url.searchParams.get('search') || '';
        const city = url.searchParams.get('city') || '';

        const offset = (page - 1) * limit;

        // Build query with search and city filter
        let query = 'SELECT * FROM suppliers WHERE 1=1';
        const params: any[] = [];

        if (search) {
            query += ' AND name LIKE ?';
            params.push(`%${search}%`);
        }

        if (city) {
            query += ' AND city = ?';
            params.push(city);
        }

        // Add sorting by created date
        query += ' ORDER BY created_at DESC';

        // Add pagination
        query += ' LIMIT ? OFFSET ?';
        params.push(limit, offset);

        // Execute query
        const suppliers = await env.DB.prepare(query)
            .bind(...params)
            .all();

        // Get total count for pagination
        let countQuery = 'SELECT COUNT(*) as total FROM suppliers WHERE 1=1';
        const countParams: any[] = [];

        if (search) {
            countQuery += ' AND name LIKE ?';
            countParams.push(`%${search}%`);
        }

        if (city) {
            countQuery += ' AND city = ?';
            countParams.push(city);
        }

        const countResult = await env.DB.prepare(countQuery)
            .bind(...countParams)
            .first<{ total: number }>();

        const total = countResult?.total || 0;
        const totalPages = Math.ceil(total / limit);

        return successResponse(
            'Suppliers retrieved successfully',
            {
                data: suppliers.results || [],
                total,
                page,
                limit,
                totalPages,
            },
            env
        );
    } catch (error) {
        console.error('Error in getSuppliers:', error);
        return errorResponse('Internal server error', 500, env);
    }
}

// GET /api/admin/suppliers/:id - Get single supplier (protected)
export async function getSupplier(request: Request, env: Env): Promise<Response> {
    try {
        // Verify JWT
        const user = await verifyRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401, env);
        }

        // Get supplier ID from URL
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const supplierId = pathParts[pathParts.length - 1];

        if (!supplierId) {
            return errorResponse('Supplier ID is required', 400, env);
        }

        // Get supplier
        const supplier = await env.DB.prepare(
            'SELECT * FROM suppliers WHERE id = ?'
        ).bind(supplierId).first();

        if (!supplier) {
            return errorResponse('Supplier not found', 404, env);
        }

        return successResponse(
            'Supplier retrieved successfully',
            { data: supplier },
            env
        );
    } catch (error) {
        console.error('Error in getSupplier:', error);
        return errorResponse('Internal server error', 500, env);
    }
}

// POST /api/admin/suppliers - Create supplier (protected)
export async function createSupplier(request: Request, env: Env): Promise<Response> {
    try {
        // Verify JWT
        const user = await verifyRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401, env);
        }

        // Parse request body
        const body = await request.json() as { name?: string; phone?: string; city?: string };
        const name = body.name?.trim();
        const phone = body.phone?.trim();
        const city = body.city?.trim();

        // Validate
        if (!name || name.length < 2) {
            return errorResponse('Name must be at least 2 characters', 400, env);
        }

        if (!phone || phone.length < 10) {
            return errorResponse('Phone must be at least 10 characters', 400, env);
        }

        if (!city || city.length < 2) {
            return errorResponse('City must be at least 2 characters', 400, env);
        }

        // Create supplier
        const supplierId = generateId();
        const now = getCurrentTimestamp();

        await env.DB.prepare(
            'INSERT INTO suppliers (id, name, phone, city, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
        ).bind(supplierId, name, phone, city, now, now).run();

        // Get created supplier
        const supplier = await env.DB.prepare(
            'SELECT * FROM suppliers WHERE id = ?'
        ).bind(supplierId).first();

        return successResponse(
            'Supplier created successfully',
            { data: supplier },
            env
        );
    } catch (error) {
        console.error('Error in createSupplier:', error);
        return errorResponse('Internal server error', 500, env);
    }
}

// PUT /api/admin/suppliers/:id - Update supplier (protected)
export async function updateSupplier(request: Request, env: Env): Promise<Response> {
    try {
        // Verify JWT
        const user = await verifyRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401, env);
        }

        // Get supplier ID from URL
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const supplierId = pathParts[pathParts.length - 1];

        if (!supplierId) {
            return errorResponse('Supplier ID is required', 400, env);
        }

        // Check if supplier exists
        const existing = await env.DB.prepare(
            'SELECT * FROM suppliers WHERE id = ?'
        ).bind(supplierId).first();

        if (!existing) {
            return errorResponse('Supplier not found', 404, env);
        }

        // Parse request body
        const body = await request.json() as { name?: string; phone?: string; city?: string };
        const name = body.name?.trim();
        const phone = body.phone?.trim();
        const city = body.city?.trim();

        // Validate if provided
        if (name !== undefined && name.length < 2) {
            return errorResponse('Name must be at least 2 characters', 400, env);
        }

        if (phone !== undefined && phone.length < 10) {
            return errorResponse('Phone must be at least 10 characters', 400, env);
        }

        if (city !== undefined && city.length < 2) {
            return errorResponse('City must be at least 2 characters', 400, env);
        }

        // Build update query dynamically
        const updates: string[] = [];
        const params: any[] = [];

        if (name !== undefined) {
            updates.push('name = ?');
            params.push(name);
        }

        if (phone !== undefined) {
            updates.push('phone = ?');
            params.push(phone);
        }

        if (city !== undefined) {
            updates.push('city = ?');
            params.push(city);
        }

        if (updates.length === 0) {
            return errorResponse('No fields to update', 400, env);
        }

        updates.push('updated_at = ?');
        params.push(getCurrentTimestamp());
        params.push(supplierId);

        // Update supplier
        await env.DB.prepare(
            `UPDATE suppliers SET ${updates.join(', ')} WHERE id = ?`
        ).bind(...params).run();

        // Get updated supplier
        const supplier = await env.DB.prepare(
            'SELECT * FROM suppliers WHERE id = ?'
        ).bind(supplierId).first();

        return successResponse(
            'Supplier updated successfully',
            { data: supplier },
            env
        );
    } catch (error) {
        console.error('Error in updateSupplier:', error);
        return errorResponse('Internal server error', 500, env);
    }
}

// DELETE /api/admin/suppliers/:id - Delete supplier (protected)
export async function deleteSupplier(request: Request, env: Env): Promise<Response> {
    try {
        // Verify JWT
        const user = await verifyRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401, env);
        }

        // Get supplier ID from URL
        const url = new URL(request.url);
        const pathParts = url.pathname.split('/');
        const supplierId = pathParts[pathParts.length - 1];

        if (!supplierId) {
            return errorResponse('Supplier ID is required', 400, env);
        }

        // Check if supplier exists
        const supplier = await env.DB.prepare(
            'SELECT * FROM suppliers WHERE id = ?'
        ).bind(supplierId).first();

        if (!supplier) {
            return errorResponse('Supplier not found', 404, env);
        }

        // Delete supplier
        await env.DB.prepare(
            'DELETE FROM suppliers WHERE id = ?'
        ).bind(supplierId).run();

        return successResponse('Supplier deleted successfully', undefined, env);
    } catch (error) {
        console.error('Error in deleteSupplier:', error);
        return errorResponse('Internal server error', 500, env);
    }
}

// GET /api/admin/suppliers/cities - Get unique cities (protected)
export async function getSupplierCities(request: Request, env: Env): Promise<Response> {
    try {
        // Verify JWT
        const user = await verifyRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401, env);
        }

        // Get unique cities sorted alphabetically
        const cities = await env.DB.prepare(
            'SELECT DISTINCT city FROM suppliers ORDER BY city ASC'
        ).all<{ city: string }>();

        return successResponse(
            'Cities retrieved successfully',
            { cities: (cities.results || []).map(row => row.city) },
            env
        );
    } catch (error) {
        console.error('Error in getSupplierCities:', error);
        return errorResponse('Internal server error', 500, env);
    }
}
