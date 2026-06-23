/*
    This file is licensed under the MIT license, the terms must be followed!
    Copyright(c) 2026 EyeDev
*/

import { ServerResponse, IncomingMessage } from 'node:http';
import type { Rivet } from './rivet';

// New route type, replaced old simple one
export type Route = {
    handler: Function;
    middlewares: Array<Middleware>;
    params: string[]; // Store param names like ['id', 'name']
    regex: RegExp; // Converted regex for matching
};

// Route handler type
export type RouteHandlers = {
    [key: string]: Route; // Changed from Function to Route
};

// Add to your types file
export class HttpError extends Error {
    statusCode: number;

    constructor(statusCode: number, message: string) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'HttpError';
    }
}

// Cookie options
export interface CookieOptions {
    httpOnly?: boolean;
    secure?: boolean;
    maxAge?: number;
    path?: string;
    domain?: string;
    sameSite?: 'Strict' | 'Lax' | 'None';
}

// HTTP response type
export type RivetResponse = ServerResponse & {
    send: (data: any) => void;
    sendAsType: (data: any, type: string) => void;
    json: (data: any) => void;
    SendFile: (filePath: string, contentType?: string) => void;
    SetCookie: (name: string, value: string, options?: CookieOptions) => void;
    ClearCookie: (name: string, options?: CookieOptions) => void;
};

export interface CorsOptions {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
}

export interface RivetPlugin {
    name: string;
    version?: string;
    install(app: Rivet): void | Promise<void>;
}

export type Middleware = (req: IncomingMessage, res: RivetResponse, next: () => void) => void;

export type RatelimitConfig = {
    enabled: boolean;
    window: number;
    max: number;
    message: string;
};
