import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'node:url';
import { notFound, errorHandler } from './middleware/errorHandler.js';
import authRoutes from './routes/authRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import payhereRoutes from './routes/payhereRoutes.js';
import productRoutes from './routes/productRoutes.js';
import voucherRoutes from './routes/voucherRoutes.js';
import adminRoutes from './admin/adminRoutes.js';
import siteContentRoutes from './routes/siteContentRoutes.js';

const app = express();
const uploadDirectory = fileURLToPath(new URL('../uploads/', import.meta.url));

app.use(helmet());
app.use('/uploads', (req, res, next) => {
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  next();
}, express.static(uploadDirectory, { immutable: true, maxAge: '1y', fallthrough: false }));
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
app.use(express.urlencoded({ extended: false })); // PayHere notify data read karanna
app.use(cookieParser());
if (process.env.NODE_ENV === 'development') app.use(morgan('dev'));

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Glam Cart API is running' });
});

app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payhere', payhereRoutes);
app.use('/api/products', productRoutes);
app.use('/api/site-content', siteContentRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;