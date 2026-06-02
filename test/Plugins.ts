// test/Plugins.ts

import { IncomingMessage } from 'node:http';
import { Rivet, RivetResponse } from '../src/index';
import { LoggingPlugin } from '../src/plugins/logging';

const app = new Rivet();

app.use(LoggingPlugin); // Install the logging plugin

// This function is called when the route "/" is called
app.get('/', (req: IncomingMessage, res: RivetResponse) => {
    res.send('hi!');
});

app.start(3000);
