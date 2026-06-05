/*
    This file is licensed under the MIT license, the terms must be followed!
    Copyright(c) 2026 EyeDev
*/

import http from 'http';
import busboy from 'busboy';
import type {
    RivetResponse,
    RouteHandlers,
    CorsOptions,
    RivetPlugin,
    Middleware,
    HttpError,
} from './types';
import { InjectResponseHelpers } from './response';
import { HandleRoute } from './route';
import { ServeStatic } from './static';

import type { IncomingMessage, Server, ServerResponse } from 'http';

// Main library class
export class Rivet {
    private plugins: RivetPlugin[] = [];
    private middlewares: Middleware[] = [];

    // Error handlers, called when an error happens
    private errorHandlers: Map<number, Function> = new Map();

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
    private serverCallbacks: Array<(server: any) => void> = [];
    private rateLimitStore = new Map<string, { count: number; resetTime: number }>();

    // Allows editing of CORS options before the server is started, or while its running
    cors(options: CorsOptions): this {
        this.corsOptions = { ...this.corsOptions, ...options };
        return this;
    }

    // Starts the HTTP server and serves on the provided port
    // NOTE: Calling with host as '0.0.0.0' will output to all interfaces! Add auth for production
    start(port: number, host?: string, callback?: () => void): void {
        this.server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
            this.OnRequest(req, res as RivetResponse);
        });

        this.serverCallbacks.forEach((cb) => cb(this.server)); // Call the callbacks

        const ListenHost = host || 'localhost'; // If an IP is passed the server will run on it!

        this.server.listen(port, ListenHost, () => {
            console.log(`Rivet fastened on ${ListenHost}:${port}`);
            callback?.();
        });
    }

    // Registers new middleware to run every request
    UseMiddleware(middleware: Middleware): this {
        this.middlewares.push(middleware);
        return this;
    }

    // Registers a callback to be called when the server starts
    OnServerCreate(callback: (server: any) => void) {
        this.serverCallbacks.push(callback);
        if (this.server) callback(this.server);
    }

    // Registers a plugin
    use(plugin: RivetPlugin): this {
        plugin.install(this); // Call the install function
        this.plugins.push(plugin);
        return this;
    }

    // Allows the server to ratelimit clients so they cannot perform a DDOS attack or overload the server
    RateLimit(options: { max?: number; window?: number } = {}) {
        const max = options.max || 100;
        const window = options.window || 60000;

        this.UseMiddleware((req, res, next) => {
            const ip = req.socket.remoteAddress || 'unknown';
            const now = Date.now();
            let record = this.rateLimitStore.get(ip);

            if (!record || now > record.resetTime) {
                record = { count: 0, resetTime: now + window };
                this.rateLimitStore.set(ip, record);
            }

            if (record.count >= max) {
                res.writeHead(429, { 'Content-Type': 'text/plain' });
                res.end('Too many requests');
                return;
            }

            record.count++;
            next();
        });

        return this;
    }

    // Parses a path and returns the regex and parameters
    private ParsePath(path: string): { regex: RegExp; paramNames: string[] } {
        const paramNames: string[] = [];

        // Replace :param with regex capture groups
        const regexPattern = path.replace(/:([a-zA-Z_][a-zA-Z0-9_]*)/g, (_, paramName) => {
            paramNames.push(paramName);
            return '([^/]+)'; // Capture anything except slash
        });

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

    // Registers a new error handler
    error(code: number, handler: Function) {
        this.errorHandlers.set(code, handler);
    }

    // Called when the server recives an request
    async OnRequest(req: IncomingMessage, res: RivetResponse): Promise<void> {
        // Run all the middleware
        let index = 0;
        const next = async () => {
            if (index < this.middlewares.length) {
                const middleware = this.middlewares[index++];
                await middleware(req, res, next);
            } else {
                await HandleRoute(
                    req,
                    res,
                    this.corsOptions,
                    this.routes,
                    this.SendError.bind(this)
                );
            }
        };

        await next();
    }

    // Sends an error and calls the handler
    SendError(error: number, req: IncomingMessage, res: RivetResponse) {
        const handler = this.errorHandlers.get(error);

        if (handler) {
            InjectResponseHelpers(res);

            handler(null, req, res); // Call the handler
        } else {
            // If there is no handler, use a generic one
            // Set proper headers and body
            res.writeHead(error, { 'Content-Type': 'text/plain' });

            let message = 'Internal Server Error';
            if (error === 404) message = '404: Page not found';
            if (error === 405) message = '405: Method Not Allowed';
            if (error === 429) message = '429: Too Many Requests';

            res.end(message);
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
                    this.SendError(404, req, res);
                }
            },
            params: [],
            regex: new RegExp(`^${prefix}.*$`),
        };
    }
}
