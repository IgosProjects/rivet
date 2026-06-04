/*
    This file is licensed under the MIT license, the terms must be followed!
    Copyright(c) 2026 EyeDev
*/

import { AddCORSHeader, HandlePreflight } from './cors';
import type { CorsOptions, RivetResponse, RouteHandlers } from './types';
import { Rivet } from './rivet';
import { ParseBody } from './body';
import { InjectResponseHelpers } from './response';

import type { IncomingMessage } from 'http';

// Called when after middleware runs, handles the route
export async function HandleRoute(
    this: Rivet,
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

        // Parse body for POST, PUT, PATCH requests
        if (method === 'POST' || method === 'PUT') {
            try {
                const body = await ParseBody(req);
                (req as any).body = body;
            } catch (err) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid request body' }));
                return;
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
            this.SendError(404, req, res);
            return;
        }
    } catch (err) {
        console.log("Route handler has encountered an exception!");
        console.error("Error details:", err);
        console.error("Error stack:", (err as any).stack);

        const statusCode = (err as any).statusCode || 500;

        sendError(statusCode, req, res);
    }
}
