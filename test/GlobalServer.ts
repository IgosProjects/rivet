// test/GlobalServer.ts

import { IncomingMessage } from 'node:http';
import { Rivet, RivetResponse } from '../src/index';

const app = new Rivet();

// This function is called when the route "/" is called
app.get('/', (req: IncomingMessage, res: RivetResponse) => {
    res.send('hi!');
});

app.start(3000, '0.0.0.0'); // PLEASE NOTE: This is not secure! Add auth in production
