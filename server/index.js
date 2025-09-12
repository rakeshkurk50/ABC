const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');

dotenv.config();

const app = express();

// Connect to the database
connectDB();

// CORS configuration: Handle preflight requests and set headers
// This robust setup allows multiple origins, falls back to a single origin,
// or uses common localhost ports for development.
let allowedOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(',').map((o) => o.trim())
  : process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : null;
const isDev = process.env.NODE_ENV !== 'production';
if (!allowedOrigins && isDev) {
  allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
}

const corsOptions = {
  origin: function (origin, callback) {
    // Allow non-browser requests (like from curl or Postman)
    if (!origin) return callback(null, true);
    // If the origin is in our allowed list, allow it
    if (allowedOrigins && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    // Otherwise, deny the request
    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Apply the single, correct CORS middleware to the entire app.
// It automatically handles preflight OPTIONS requests for all routes.
app.use(cors(corsOptions));

// Initialize Middleware
app.use(express.json({ extended: false }));

// Simple debug logger for incoming requests (can be removed later)
app.use((req, res, next) => {
  console.log('[DEBUG] method=', req.method, 'origin=', req.headers.origin);
  next();
});

// Define Routes
app.get('/', (req, res) => res.send('API Running'));
app.use('/api/auth', require('./routes/auth'));

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
