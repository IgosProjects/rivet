/*
    This file is licensed under the MIT license, the terms must be followed!
    Copyright(c) 2026 EyeDev
*/

import type { IncomingMessage } from 'http';

// Parses the request body
export async function ParseBody(req: IncomingMessage): Promise<any> {
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
