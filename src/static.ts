import fs from 'fs';
import path from 'path';
import { IncomingMessage, ServerResponse } from 'http';
import { GetMimeType } from './mime';

// Serves the contents of a folder as static files on the server
export function ServeStatic(rootDir: string) {
    const absoluteRoot = path.resolve(rootDir);

    return async (req: IncomingMessage, res: ServerResponse): Promise<boolean> => {
        const url = req.url?.split('?')[0] || '/';

        // Convert URL to file path
        let filePath = path.join(absoluteRoot, url);

        // Security: prevent directory traversal
        if (!filePath.startsWith(absoluteRoot)) {
            return false;
        }

        // Check if file exists
        try {
            const stat = await fs.promises.stat(filePath);

            if (stat.isDirectory()) {
                // Try index.html, if its there make it so the root returns index.html
                filePath = path.join(filePath, 'index.html');
                try {
                    await fs.promises.stat(filePath);
                } catch {
                    return false; // No index.html
                }
            }

            // Serve the file
            const mimeType = GetMimeType(filePath);
            const stream = fs.createReadStream(filePath);
            const contentType = mimeType.startsWith('text/')
                ? `${mimeType}; charset=utf-8`
                : mimeType;

            res.writeHead(200, { 'Content-Type': contentType });
            stream.pipe(res);

            stream.on('error', () => {
                res.writeHead(500);
                res.end();
            });

            return true;
        } catch {
            return false; // File not found
        }
    };
}
