// test/BasicServer.ts

import { IncomingMessage } from 'node:http';
import { Rivet, RivetResponse } from '../src/index';

const app = new Rivet();

// This function is called when the route "/" is called
app.get('/', (req: IncomingMessage, res: RivetResponse) => {
    res.send('hi!');
});

app.start(3000);
