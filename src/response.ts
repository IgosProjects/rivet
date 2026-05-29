import fs from 'fs';
import path from 'path';
import { RivetResponse } from './types';
import { GetMimeType } from './mime';

export function InjectResponseHelpers(res: RivetResponse): void {
    res.send = (data: any) => {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
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
}
