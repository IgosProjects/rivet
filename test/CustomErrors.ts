// test/CustomErrors.ts

import { IncomingMessage } from 'node:http';
import { Rivet, RivetResponse } from '../src/index';

const app = new Rivet();

app.error(404, (err: string, req: IncomingMessage, res: RivetResponse) => {
    res.send('404');
    res.send('Page not found');
    res.send('Undertext');
    res.send('Underundertext');
});

// This function is called when the route "/" is called
app.get('/', (req: IncomingMessage, res: RivetResponse) => {
    res.send('go to /hdsggdfkglh or any random url to get a custom 404 error');
});

app.start(3000);
