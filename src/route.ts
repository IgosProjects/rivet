/*
    This file is licensed under the MIT license, the terms must be followed!
    Copyright(c) 2026 EyeDev
*/

import { AddCORSHeader, HandlePreflight } from './cors';
import type { CorsOptions, RivetResponse, RouteHandlers } from './types';
import { Rivet } from './rivet';
import { ParseBody } from './body';
import busboy from 'busboy'
import { InjectResponseHelpers } from './response';

import type { IncomingMessage } from 'http';

function ParseMultipart(req: IncomingMessage): Promise<{ fields: any; files: any }> {
    return new Promise((resolve, reject) => {
        const bb = busboy({ headers: req.headers });
        const fields: any = {};
        const files: any = {};
        
        bb.on('field', (name: any, value: any) => { fields[name] = value; });
        bb.on('file', (name: any, file: any, info: any) => {
            const chunks: Buffer[] = [];
            file.on('data', (chunk: any) => chunks.push(chunk));
            file.on('end', () => {
                files[name] = {
                    filename: info.filename,
                    mimeType: info.mimeType,
                    data: Buffer.concat(chunks),
                    size: chunks.reduce((acc, c) => acc + c.length, 0)
                };
            });
        });
        bb.on('finish', () => resolve({ fields, files }));
        bb.on('error', reject);
        req.pipe(bb);
    });
}

// Called when after middleware runs, handles the route
export async function HandleRoute(
    req: IncomingMessage,
    res: RivetResponse,
    corsOptions: CorsOptions,
    routes: { GET: RouteHandlers; POST: RouteHandlers; PUT: RouteHandlers; DELETE: RouteHandlers },
    sendError: (error: number, req: IncomingMessage, res: RivetResponse) => void
): Promise<void> {
    try {
        // Always apply CORS headers
        AddCORSHeader(res, corsOptions);

        // Handle preflight
        if (HandlePreflight(req, res)) return;

        const method = req.method as keyof typeof routes; // Get the HTTP method
        const url = req.url?.split('?')[0] || '/'; // Get the URL and strip the query params

        // Parse query parameters
        const urlObj = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
        const query = Object.fromEntries(urlObj.searchParams);
        (req as any).query = query;

        const contentType = req.headers['content-type'] || '';

        // Handle different content types
        if (method === 'POST' || method === 'PUT') {
            if (
                contentType.includes('application/json') ||
                contentType.includes('application/x-www-form-urlencoded')
            ) {
                try {
                    (req as any).body = await ParseBody(req);
                } catch (err) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: 'Invalid request body' }));
                    return;
                }
            } else if (contentType.includes('multipart/form-data')) {
                // Handle form data

                const { fields, files } = await ParseMultipart(req);
                (req as any).fields = fields;
                (req as any).files = files;
            }
        }

        const methodRoutes = routes[method];
        if (!methodRoutes) {
            res.writeHead(405, { 'Content-Type': 'text/plain' });
            res.end('405: Method Not Allowed');
            return;
        }

        // Try exact match first (fast path)
        let route = methodRoutes[url];
        let params: Record<string, string> = {};

        // If no exact match, try regex
        if (!route) {
            for (const [pattern, r] of Object.entries(methodRoutes)) {
                if (pattern.endsWith('*')) continue; // Check if "/*" or such

                const match = url.match(r.regex);
                if (match) {
                    route = r;
                    // Extract params from capture groups
                    r.params.forEach((paramName, index) => {
                        params[paramName] = match[index + 1];
                    });
                    break;
                }
            }
        }

        // If still no match, try wildcard (static files)
        if (!route) {
            for (const [pattern, r] of Object.entries(methodRoutes)) {
                if (pattern.endsWith('*') && url.startsWith(pattern.slice(0, -1))) {
                    route = r;
                    break;
                }
            }
        }

        // If a handler was registered, call it
        if (route && route.handler) {
            InjectResponseHelpers(res); // Injects response helpers into the res object
            (req as any).params = params;

            await route.handler(req, res); // Now finnaly, call the handler
        } else {
            sendError(404, req, res);
            return;
        }
    } catch (err) {
        console.log('Route handler has encountered an exception!');
        console.error('Error details:', err);
        console.error('Error stack:', (err as any).stack);

        const statusCode = (err as any).statusCode || 500;

        sendError(statusCode, req, res);
    }
}
