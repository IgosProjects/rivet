// test/Params.ts

import { IncomingMessage, IncomingMessageEventMap } from 'node:http';
import { Rivet, RivetResponse } from '../src/index';

const app = new Rivet();

//app.static("/", "./test/public"); // Serve the public directory as a static file

// Returns the passed in user id
app.get('/users/:id', (req: IncomingMessage, res: RivetResponse) => {
    const { id } = (req as any).params;
    res.json({ userId: id, message: `Fetching user ${id}` });
});

// DEBUG: Check what's actually registered
console.log('Registered GET routes:', Object.keys((app as any).routes.GET));
console.log('First route regex:', (app as any).routes.GET['/users/:id']?.regex?.source);

app.start(3000);
