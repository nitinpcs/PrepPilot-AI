import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import morgan from 'morgan';
import connectDB from './config/db.js';
import authRoutes from './routes/auth.js';
import interviewRoutes from './routes/interview.js';
import codingInterviewRoutes from './routes/codingInterview.js';
import rateLimiter from './middleware/rateLimiter.js';
import { ApiError } from './errors/ApiError.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// Security middlewares
app.use(helmet());
app.use(morgan('combined'));
app.use(rateLimiter);

// CORS configuration
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Set body parser limits for large PDF uploads (base64)
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Mount API Routes
app.use('/api/auth', authRoutes);
app.use('/api/interview', interviewRoutes);
app.use('/api/coding-interview', codingInterviewRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', time: new Date() });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// Must be registered AFTER all routes (4-argument signature required by Express)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  const isProd = process.env.NODE_ENV === 'production';

  // ── Known application errors ──────────────────────────────────────────────
  if (err instanceof ApiError) {
    const body = {
      success: false,
      message: err.message,
    };
    if (err.errors && err.errors.length > 0) body.errors = err.errors;
    if (err.meta) Object.assign(body, err.meta); // forward extra fields (e.g. needsVerification)
    return res.status(err.statusCode).json(body);
  }

  // ── Mongoose bad ObjectId ─────────────────────────────────────────────────
  if (err.name === 'CastError') {
    return res.status(404).json({ success: false, message: 'Resource not found' });
  }

  // ── Mongoose validation error ─────────────────────────────────────────────
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map((e) => ({
      field: e.path,
      message: e.message,
    }));
    return res.status(422).json({ success: false, message: 'Validation failed', errors });
  }

  // ── JWT errors ────────────────────────────────────────────────────────────
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ success: false, message: 'Session expired, please login again' });
  }
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ success: false, message: 'Invalid token' });
  }

  // ── Unexpected errors ─────────────────────────────────────────────────────
  console.error('Unhandled error:', isProd ? err.message : err.stack);
  res.status(500).json({
    success: false,
    message: isProd ? 'An internal server error occurred' : err.message,
  });
});

const PORT = process.env.PORT || 5002;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
