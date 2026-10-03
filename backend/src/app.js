import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      const allowedOrigins = [
        'http://localhost:5173',
        'http://127.0.0.1:5173',
      ]
      callback(null, !origin || allowedOrigins.includes(origin))
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '8mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Glam Cart API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;