import { Rivet } from '../src/index';

const app = new Rivet();

// Global rate limit: 100 requests per minute per IP
app.RateLimit({ max: 1000, window: 60000 });

// Enable CORS for all routes
app.cors({
    origin: '*', // Allow any origin (for testing)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    headers: ['Content-Type', 'Authorization'],
});

// Or per route
app.get('/api/login', (req: any, res: any) => {
    // Rate limited to 5 attempts per minute
    res.send('recived!');
    console.log('request!');
});

app.start(3000);
