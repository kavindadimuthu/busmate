import cors from 'cors';
import { env } from '../config/env';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    if (!origin || env.ALLOWED_ORIGINS.includes(origin) || env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 3600,
});
