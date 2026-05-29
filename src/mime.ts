/*
    This file is licensed under the MIT license, the terms must be followed!
    Copyright(c) 2026 EyeDev
*/

// Returns the MIME type of any file
export function GetMimeType(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';
    const mimeTypes: Record<string, string> = {
        html: 'text/html',
        css: 'text/css',
        js: 'application/javascript',
        json: 'application/json',
        png: 'image/png',
        jpg: 'image/jpeg',
        jpeg: 'image/jpeg',
        gif: 'image/gif',
        svg: 'image/svg+xml',
        txt: 'text/plain',
        pdf: 'application/pdf',
    };
    return mimeTypes[ext] || 'application/octet-stream';
}
