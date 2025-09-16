const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');

dotenv.config();

const app = express();

// Connect to the database
connectDB();

// Determine allowed CORS origins
let allowedOrigins = process.env.CLIENT_URLS
  ? process.env.CLIENT_URLS.split(',').map((o) => o.trim())
  : process.env.CLIENT_URL
  ? [process.env.CLIENT_URL]
  : null;

const isDev = process.env.NODE_ENV !== 'production';
if (!allowedOrigins && isDev) {
  allowedOrigins = ['http://localhost:5173', 'http://localhost:5174'];
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

// Apply CORS middleware globally
app.use(cors(corsOptions));

// ✅ Explicitly handle preflight requests
app.options('*', cors(corsOptions));

// Parse incoming JSON
app.use(express.json());

// Debug logger for requests
app.use((req, res, next) => {
  console.log('[DEBUG] method=', req.method, 'origin=', req.headers.origin);
  next();
});

// Define Routes
app.get('/', (req, res) => res.send('API Running'));
app.use('/api/auth', require('./routes/auth'));

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
