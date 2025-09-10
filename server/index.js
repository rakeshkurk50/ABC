const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');

dotenv.config();

const app = express();

// Connect Database
connectDB();

// Fallback CORS headers: ensure preflight responses include the correct headers
// This runs before other middleware to guarantee the browser sees CORS headers
// Robust CORS handling: allow a single CLIENT_URL or comma-separated CLIENT_URLS
// If no env provided, in development allow common localhost ports (5173, 5174).
let allowedOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(',').map((o) => o.trim())
  : process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : null;
const isDev = process.env.NODE_ENV !== 'production';
if (!allowedOrigins && isDev) {
  allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
}

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  let originToSet = '*';

  if (allowedOrigins && requestOrigin) {
    // If the request origin is in the allow-list, use it; otherwise don't set CORS
    if (allowedOrigins.includes(requestOrigin)) originToSet = requestOrigin;
  } else if (allowedOrigins && !requestOrigin) {
    // No Origin header (non-browser request), set first allowed origin
    originToSet = allowedOrigins[0] || '*';
  } else if (!allowedOrigins && requestOrigin) {
    // No env specified: reflect origin for convenience during development
    originToSet = requestOrigin;
  }

  res.header('Access-Control-Allow-Origin', originToSet);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (originToSet !== '*') res.header('Access-Control-Allow-Credentials', 'true');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Ensure preflight for API paths always returns CORS headers (explicit route)
app.options('/api/*', (req, res) => {
  const requestOrigin = req.headers.origin;
  let originToSet = '*';

  if (allowedOrigins && requestOrigin) {
    if (allowedOrigins.includes(requestOrigin)) originToSet = requestOrigin;
  } else if (allowedOrigins && !requestOrigin) {
    originToSet = allowedOrigins[0] || '*';
  } else if (!allowedOrigins && requestOrigin) {
    originToSet = requestOrigin;
  }

  res.header('Access-Control-Allow-Origin', originToSet);
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (originToSet !== '*') res.header('Access-Control-Allow-Credentials', 'true');
  return res.sendStatus(204);
});

// CORS configuration using a dynamic origin checker so we can validate origins
const corsOptions = {
  origin: function (origin, callback) {
    // allow non-browser requests (no origin) like curl/postman
    if (!origin) return callback(null, true);
    if (allowedOrigins && allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Attach CORS early so preflight requests are handled before other middleware
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// simple debug logger for incoming requests (leave during troubleshooting)
app.use((req, res, next) => {
  console.log('[CORS DEBUG] method=', req.method, 'origin=', req.headers.origin);
  next();
});

// Init Middleware
app.use(express.json({ extended: false }));


app.get('/', (req, res) => res.send('API Running'));

// Define Routes
app.use('/api/auth', require('./routes/auth'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
