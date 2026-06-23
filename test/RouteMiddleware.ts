// test/RouteMiddleware.ts

import { IncomingMessage } from 'node:http';
import { Rivet, RivetResponse } from '../src/index';

const app = new Rivet();

function MyMiddleware(req: IncomingMessage, res: RivetResponse, next: () => void)  {
    console.log("Recived route request!");
    next();
}

// This function is called when the route "/" is called, we add an extra route middleware to it
app.get('/', (req: IncomingMessage, res: RivetResponse) => {
    res.send("Hello!");
}, [MyMiddleware]);

app.start(3000);