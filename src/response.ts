/*
    This file is licensed under the MIT license, the terms must be followed!
    Copyright(c) 2026 EyeDev
*/

import fs from 'fs';
import path from 'path';
import { RivetResponse, CookieOptions } from './types';
import { GetMimeType } from './mime';

export function InjectResponseHelpers(res: RivetResponse): void {
    res.send = (data: any) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end(String(data));
    };

    res.sendAsType = (data: any, type: string) => {
        res.writeHead(200, { 'Content-Type': type });
        res.end(String(data));
    };

    res.json = (data: any) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    };

    res.SendFile = (filePath: string, contentType?: string) => {
        const fullPath = path.resolve(filePath);

        if (!fullPath.startsWith(process.cwd())) {
            res.writeHead(403, { 'Content-Type': 'text/plain' });
            res.end('403: Forbidden');
            return;
        }

        fs.access(fullPath, fs.constants.R_OK, (err) => {
            if (err) {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end('404: File not found');
                return;
            }

            const mimeType = contentType || GetMimeType(fullPath);
            const stream = fs.createReadStream(fullPath);
            res.writeHead(200, { 'Content-Type': mimeType });
            stream.pipe(res);

            stream.on('error', () => {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('500: Internal Server Error');
            });
        });
    };

    // Sets a cookie with the name to the value
    res.SetCookie = (name: string, value: string, options: CookieOptions = {}) => {
        let cookie = `${name}=${encodeURIComponent(value)}`;
        if (options.httpOnly) cookie += '; HttpOnly';
        if (options.secure) cookie += '; Secure';
        if (options.maxAge) cookie += `; Max-Age=${options.maxAge}`;
        if (options.path) cookie += `; Path=${options.path || '/'}`;
        if (options.domain) cookie += `; Domain=${options.domain}`;
        if (options.sameSite) cookie += `; SameSite=${options.sameSite}`;
        res.setHeader('Set-Cookie', cookie);
    };

    // Clears a cookie with the following name and deletes it
    res.ClearCookie = (name: string, options: CookieOptions = {}) => {
        res.SetCookie(name, '', { ...options, maxAge: 0 });
    };
}
