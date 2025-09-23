const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const cors = require('cors');
const { createCampaign } = require('./services/campaignService');

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
  allowedOrigins = ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:5000'];
}

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (isDev && origin.startsWith('http://localhost')) {
      return callback(null, true);
    }
    
    if (allowedOrigins && allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'api-key'],
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

app.post('/api/campaigns', async (req, res) => {
  const { name, subject, sender, htmlContent, recipients, scheduledAt } = req.body;
  try {
    const result = await createCampaign({ name, subject, sender, htmlContent, recipients, scheduledAt });
    if (result.success) {
      res.status(200).json({ message: 'Campaign created successfully', data: result.data });
    } else {
      res.status(500).json({ message: 'Failed to create campaign', error: result.error });
    }
  } catch (error) {
    console.error('Error in campaign creation endpoint:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server started on port ${PORT}`));
