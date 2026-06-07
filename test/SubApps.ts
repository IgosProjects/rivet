// test/SubApps.ts

import { IncomingMessage } from 'node:http';
import { Rivet, RivetResponse } from '../src/index';

const app = new Rivet();
const subapp = new Rivet();

app.branch("/sub", subapp);

// This function is called when the route "/" is called on the main app
app.get('/', (req: IncomingMessage, res: RivetResponse) => {
    res.send('Request was handled by main app!');
});

// This function is called when the route "/" is called on the subapp
subapp.get('/', (req: IncomingMessage, res: RivetResponse) => {
    res.send('Request was handled by subapp!');
});

app.start(3000);