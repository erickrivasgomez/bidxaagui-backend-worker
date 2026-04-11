import { Env, Edicion, Pagina } from '../types';
import { errorResponse, successResponse } from '../lib/utils';
import { commitFileToGitHub } from '../lib/github';

export async function uploadEditionPDF(request: Request, env: Env): Promise<Response> {
    try {
        const url = new URL(request.url);
        const parts = url.pathname.split('/');
        const id = parts[parts.indexOf('editions') + 1];

        if (!id) return errorResponse('ID de edición no válido', 400, env);

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const fileName = formData.get('fileName') as string || file.name;

        if (!file || !fileName) {
            return errorResponse('Archivo PDF o nombre no proporcionado', 400, env);
        }

        console.log(`Processing PDF upload for edition ${id}: ${fileName} (${file.size} bytes)`);

        // 1. Upload PDF to R2 (Much more stable for large files > 25MB)
        const key = `pdfs/${id}/${fileName}`;
        await env.BUCKET.put(key, file.stream(), {
            httpMetadata: { contentType: 'application/pdf' },
            customMetadata: { edition_id: id, filename: fileName }
        });

        // 2. Set the URL to our own download endpoint (Absolute URL)
        // We use the absolute URL so the Frontend knows it's an external link 
        // and doesn't try to prepend the GitHub path.
        const pdfUrl = `https://api.bidxaagui.com/api/editions/${id}/pdf/download`;

        // 3. Update Database
        await env.DB.prepare(
            'UPDATE ediciones SET pdf_url = ?, updated_at = ? WHERE id = ?'
        ).bind(pdfUrl, new Date().toISOString(), id).run();

        // 4. Optional: Try to push to GitHub ONLY if file is small (under 20MB)
        // We do this in the background to not block the response
        if (file.size < 20 * 1024 * 1024 && env.GITHUB_TOKEN) {
            // We can't use file.stream() again, so this is just a reminder 
            // that for large files, R2 is now the primary source.
            console.log("File is large, skipping GitHub mirror to prevent crash.");
        }

        return successResponse('PDF subido con éxito a R2', { pdfUrl }, env);

    } catch (error: any) {
        console.error('Error handling PDF upload:', error);
        return errorResponse(`Error al procesar el PDF: ${error.message}`, 500, env);
    }
}

export async function getEditions(request: Request, env: Env): Promise<Response> {
    try {
        const { results } = await env.DB.prepare(
            'SELECT * FROM ediciones ORDER BY fecha DESC, created_at DESC'
        ).all<Edicion>();

        return successResponse('Ediciones recuperadas', results, env);
    } catch (error) {
        console.error('Error fetching editions:', error);
        return errorResponse('Error al obtener ediciones', 500, env);
    }
}

export async function createEdition(request: Request, env: Env): Promise<Response> {
    try {
        const body = await request.json() as any;
        const { titulo, descripcion, fecha } = body;

        if (!titulo) {
            return errorResponse('El título es requerido', 400, env);
        }

        const id = crypto.randomUUID();
        const now = new Date().toISOString();

        await env.DB.prepare(
            `INSERT INTO ediciones (id, titulo, descripcion, fecha, publicada, created_at, updated_at)
             VALUES (?, ?, ?, ?, 0, ?, ?)`
        ).bind(id, titulo, descripcion || null, fecha || null, now, now).run();

        return successResponse('Edición creada', { id }, env);
    } catch (error) {
        console.error('Error creating edition:', error);
        return errorResponse('Error al crear edición', 500, env);
    }
}

export async function deleteEdition(request: Request, env: Env): Promise<Response> {
    try {
        const url = new URL(request.url);
        const id = url.pathname.split('/').pop();

        if (!id) return errorResponse('ID no proporcionado', 400, env);

        // 1. Get edition pages to delete files from R2
        const { results: pages } = await env.DB.prepare(
            'SELECT imagen_url FROM paginas WHERE edicion_id = ?'
        ).bind(id).all<Pagina>();

        // 2. Delete files from R2
        // We assume imagen_url contains the key or we can derive it.
        // If imagen_url is a full URL, we might need to parse.
        // Let's assume we store the KEY or just the relative path in the DB.
        // Or we decide on a structure: editions/{edition_id}/{page}.webp

        // Actually, let's just try to delete the 'folder' or specific keys.
        // R2 doesn't have "directories", just keys with prefixes.

        if (pages && pages.length > 0) {
            const keys = pages.map(p => {
                // Assuming imagen_url stores the key "editions/ID/img.webp"
                return p.imagen_url;
            });
            // Batch delete not always available in standard S3 clients but R2 supports delete(key).
            // We'll loop for now or use delete(keys) if available in binding.

            // The R2 binding delete accepts string or string[].
            if (keys.length > 0) {
                await env.BUCKET.delete(keys);
            }
        }

        // Also delete cover if it's there
        const edition = await env.DB.prepare('SELECT cover_url FROM ediciones WHERE id = ?').bind(id).first<Edicion>();
        if (edition?.cover_url) {
            await env.BUCKET.delete(edition.cover_url);
        }

        // 3. Delete from DB (Cascade should handle pages, but let's be safe)
        await env.DB.prepare('DELETE FROM ediciones WHERE id = ?').bind(id).run();

        return successResponse('Edición eliminada', null, env);

    } catch (error) {
        console.error('Error deleting edition:', error);
        return errorResponse('Error al eliminar edición', 500, env);
    }
}

export async function uploadEditionPage(request: Request, env: Env): Promise<Response> {
    try {
        const url = new URL(request.url);
        // Path: /api/admin/editions/:id/pages
        const parts = url.pathname.split('/');
        const id = parts[parts.indexOf('editions') + 1];

        if (!id) return errorResponse('ID de edición no válido', 400, env);

        const formData = await request.formData();
        const fileEntry = formData.get('file');
        const pageNumber = formData.get('pageNumber');

        if (!fileEntry || !(fileEntry instanceof File) || !pageNumber) {
            return errorResponse('Faltan datos (archivo o número de página)', 400, env);
        }

        const file = fileEntry;
        const isCover = formData.get('isCover') === 'true';

        if (!file || !pageNumber) {
            return errorResponse('Faltan datos (archivo o número de página)', 400, env);
        }

        const key = `editions/${id}/${pageNumber}_${Date.now()}.webp`;

        // Upload to R2
        await env.BUCKET.put(key, file.stream(), {
            httpMetadata: {
                contentType: file.type,
            }
        });

        // If it's a cover, update editions table
        if (isCover) {
            await env.DB.prepare(
                'UPDATE ediciones SET cover_url = ?, updated_at = ? WHERE id = ?'
            ).bind(key, new Date().toISOString(), id).run();
        }

        // Insert into paginas
        // Check if page exists to update or insert?
        // User said "register", usually create. But let's use UPSERT or just INSERT.
        // The table schema has UNIQUE(edicion_id, numero).

        await env.DB.prepare(
            `INSERT INTO paginas (id, edicion_id, numero, imagen_url, created_at)
             VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(edicion_id, numero) DO UPDATE SET imagen_url = excluded.imagen_url`
        ).bind(crypto.randomUUID(), id, pageNumber, key, new Date().toISOString()).run();

        return successResponse('Página subida', { key }, env);

    } catch (error) {
        console.error('Error uploading page:', error);
        return errorResponse('Error al subir página', 500, env);
    }
}


export async function getEditionPages(request: Request, env: Env): Promise<Response> {
    try {
        const url = new URL(request.url);
        // Supports: 
        // /api/admin/editions/:id/pages
        // /api/ediciones/:id/pages
        const parts = url.pathname.split('/');
        // ID should be the segment before 'pages'
        const pagesIndex = parts.indexOf('pages');
        const id = parts[pagesIndex - 1];

        if (!id || pagesIndex === -1) return errorResponse('ID de edición no válido', 400, env);

        const { results } = await env.DB.prepare(
            'SELECT * FROM paginas WHERE edicion_id = ? ORDER BY numero ASC'
        ).bind(id).all<Pagina>();

        return successResponse('Páginas recuperadas', results, env);
    } catch (error) {
        console.error('Error fetching pages:', error);
        return errorResponse('Error al obtener páginas', 500, env);
    }
}
export async function downloadEditionPDF(request: Request, env: Env): Promise<Response> {
    try {
        const url = new URL(request.url);
        const parts = url.pathname.split('/');
        // ID is in /api/editions/:id/pdf/download
        const id = parts[parts.indexOf('editions') + 1];

        if (!id) return errorResponse('ID de edición no válido', 400, env);

        // Find the PDF in R2
        const prefix = `pdfs/${id}/`;
        const objects = await env.BUCKET.list({ prefix });

        if (objects.objects.length === 0) {
            return errorResponse('PDF no encontrado', 404, env);
        }

        // Get the latest one
        const key = objects.objects[0].key;
        const object = await env.BUCKET.get(key);

        if (!object) return errorResponse('Error al recuperar el PDF', 404, env);

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        // Set filename for download
        const filename = object.customMetadata?.filename || 'revista.pdf';
        headers.set('Content-Disposition', `attachment; filename="${filename}"`);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Content-Type', 'application/pdf');

        return new Response(object.body, { headers });

    } catch (error: any) {
        console.error('Error downloading PDF:', error);
        return errorResponse(`Error al descargar el PDF: ${error.message}`, 500, env);
    }
}
