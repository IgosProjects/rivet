// test/StaticServer.ts

import { Rivet } from '../src/index';

const app = new Rivet();

app.static('/', './test/public');

app.start(3000);
