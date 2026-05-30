/*
    This file is licensed under the MIT license, the terms must be followed!
    Copyright(c) 2026 EyeDev
*/

// This file handles CORS on the server side, it is used for security

import type { RivetResponse, CorsOptions } from './types';

const DefaultCorsOptions: CorsOptions = {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization'],
    credentials: false,
};

// Adds the needed CORS tags to the response header
export function AddCORSHeader(res: RivetResponse, options: CorsOptions = DefaultCorsOptions) {
    const opts = { ...DefaultCorsOptions, ...options };

    // Origin
    const origin = Array.isArray(opts.origin) ? opts.origin.join(', ') : opts.origin;
    res.setHeader('Access-Control-Allow-Origin', origin || '*');

    // Headers
    if (opts.headers) {
        res.setHeader('Access-Control-Allow-Headers', opts.headers.join(', '));
    }

    // Credentials
    if (opts.credentials) {
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }
}

// Handles preflight request sent by browsers
export function HandlePreflight(req: any, res: RivetResponse): boolean {
    if (req.method === 'OPTIONS') {
        res.writeHead(204); // 204: No content
        res.end();
        return true;
    }
    return false;
}
