/*
    This file is licensed under the MIT license, the terms must be followed!
    Copyright(c) 2026 EyeDev
*/

import { ServerResponse } from 'node:http';

// New route type, replaced old simple one
export type Route = {
    handler: Function;
    params: string[]; // Store param names like ['id', 'name']
    regex: RegExp; // Converted regex for matching
};

// Route handler type
export type RouteHandlers = {
    [key: string]: Route; // Changed from Function to Route
};

// HTTP response type
export type RivetResponse = ServerResponse & {
    send: (data: any) => void;
    json: (data: any) => void;
    SendFile: (filePath: string, contentType?: string) => void;
};

export interface CorsOptions {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
}
