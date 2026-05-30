/*
    This file is licensed under the MIT license, the terms must be followed!
    Copyright(c) 2026 EyeDev
*/

import http from 'http';
import type { RivetResponse, RouteHandlers, CorsOptions } from './types';
import { InjectResponseHelpers } from './response';
import { AddCORSHeader, HandlePreflight } from './cors';
import { ServeStatic } from './static';

import type { IncomingMessage, Server, ServerResponse } from 'http';

// Parses the request body
async function ParseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];

        req.on('data', (chunk) => {
            chunks.push(chunk);
        });

        req.on('end', () => {
            const body = Buffer.concat(chunks).toString();

            // No body
            if (!body) {
                resolve({});
                return;
            }

            // Check content type
            const contentType = req.headers['content-type'] || '';

            if (contentType.includes('application/json')) {
                try {
                    resolve(JSON.parse(body));
                } catch (e) {
                    resolve({});
                }
            } else if (contentType.includes('application/x-www-form-urlencoded')) {
                // Parse form data: "name=Alice&age=30" → { name: "Alice", age: "30" }
                const params = new URLSearchParams(body);
                const result: Record<string, string> = {};
                params.forEach((value, key) => {
                    result[key] = value;
                });
                resolve(result);
            } else {
                // Plain text
                resolve(body);
            }
        });

        req.on('error', (err) => {
            reject(err);
        });
    });
}

// Main library class
export class Rivet {
    private server: Server | null = null;
    routes: {
        GET: RouteHandlers;
        POST: RouteHandlers;
        PUT: RouteHandlers;
        DELETE: RouteHandlers;
    };

    constructor() {
        // Route function handlers are defined in here
        this.routes = {
            GET: {},
            POST: {},
            PUT: {},
            DELETE: {},
        };
    }

    private corsOptions: CorsOptions = {};

    // Allows editing of CORS options before the server is started, or while its running
    cors(options: CorsOptions): this {
        this.corsOptions = { ...this.corsOptions, ...options };
        return this;
    }

    // Starts the HTTP server and serves on the provided port
    start(port: number, callback?: () => void): void {
        this.server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
            this.OnRequest(req, res as RivetResponse);
        });

        this.server.listen(port, () => {
            console.log(`Rivet fastened on ${port}`);
            callback?.();
        });
    }

    // Parses a path and returns the regex and parameters
    private ParsePath(path: string): { regex: RegExp; paramNames: string[] } {
        const paramNames: string[] = [];

        // Replace :param with regex capture groups
        const regexPattern = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, paramName) => {
            paramNames.push(paramName);
            return '([^/]+)'; // Capture anything except slash
        });

        console.log('Path:', path, '→ Regex:', regexPattern); // Debug

        // Create regex that matches exactly
        const regex = new RegExp(`^${regexPattern}$`);

        return { regex, paramNames };
    }

    // Registers a new GET handler
    get(path: string, handler: Function): void {
        const { regex, paramNames } = this.ParsePath(path);
        this.routes.GET[path] = {
            handler,
            params: paramNames,
            regex,
        };
    }

    // Registers a new POST handler
    post(path: string, handler: Function): void {
        const { regex, paramNames } = this.ParsePath(path);
        this.routes.POST[path] = {
            handler,
            params: paramNames,
            regex,
        };
    }

    // Called when an request happends on the server
    async OnRequest(req: IncomingMessage, res: RivetResponse): Promise<void> {
        // Always apply CORS headers
        AddCORSHeader(res, this.corsOptions);

        // Handle preflight
        if (HandlePreflight(req, res)) return;

        const method = req.method as keyof typeof this.routes; // Get the HTTP method
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

        const methodRoutes = this.routes[method];
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
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('404: Page not found!');
        }
    }

    // Serves a static directory on the server
    static(prefix: string, directory: string): void {
        const StaticHandler = ServeStatic(directory);

        // Register a catch-all handler for this prefix
        this.routes.GET[`${prefix}*`] = {
            handler: async (req: IncomingMessage, res: RivetResponse) => {
                const served = await StaticHandler(req, res);
                if (!served) {
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404: File not found!');
                }
            },
            params: [],
            regex: new RegExp(`^${prefix}.*$`),
        };
    }
}
