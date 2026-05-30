import type { RivetPlugin, Middleware } from '../types';

export const LoggingPlugin: RivetPlugin = {
    name: 'logging',
    version: '1.0.0',
    install(app) {
        app.UseMiddleware((req, res, next) => {
            const start = Date.now();
            const method = req.method;
            const url = req.url;
            console.log(`${method} ${url}`);

            // Use 'finish' event instead of overriding end
            res.once('finish', () => {
                const duration = Date.now() - start;
                console.log(`${method} ${url} - ${duration}ms`);
            });

            next();
        });
    },
};
