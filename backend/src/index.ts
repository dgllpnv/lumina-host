import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Import routes
import authRoutes from './routes/auth.routes.js';
import organizationsRoutes from './routes/organizations.routes.js';
import teamRoutes from './routes/team.routes.js';
import transactionsRoutes from './routes/transactions.routes.js';
import inventoryRoutes from './routes/inventory.routes.js';
import tablesRoomsRoutes from './routes/tables-rooms.routes.js';
import reservationsRoutes from './routes/reservations.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import systemRoutes from './routes/system.routes.js';
import publicSiteRoutes from './routes/public-site.routes.js';
import roomContentRoutes from './routes/room-content.routes.js';
import packagesRoutes from './routes/packages.routes.js';
import tipsRoutes from './routes/tips.routes.js';
import paymentMethodsRoutes from './routes/payment-methods.routes.js';
import icalFeedsRoutes from './routes/ical-feeds.routes.js';

// Initialize Prisma
export const prisma = new PrismaClient();

// Initialize Express
const app = express();

// CORS configuration
// Aceita origens explicitas em ALLOWED_ORIGINS (CSV) e qualquer subdominio
// *.easypanel.host (URLs temporarias do EasyPanel mudam com hash).
const allowedOrigins = (process.env.ALLOWED_ORIGINS || process.env.FRONTEND_URL || 'http://localhost:8080')
  .split(',')
  .map(origin => origin.trim());

const EASYPANEL_PATTERN = /^https:\/\/[a-z0-9-]+\.[a-z0-9]+\.easypanel\.host$/i;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*') || EASYPANEL_PATTERN.test(origin)) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      success: true,
      message: 'Server is healthy',
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server is running but database connection failed',
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/system', systemRoutes);
app.use('/api/organizations', organizationsRoutes);
app.use('/api/team', teamRoutes);
app.use('/api/transactions', transactionsRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/tables-rooms', tablesRoomsRoutes);
app.use('/api/reservations', reservationsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/public', publicSiteRoutes);
app.use('/api/room-contents', roomContentRoutes);
app.use('/api/packages', packagesRoutes);
app.use('/api/tips', tipsRoutes);
app.use('/api/payment-methods', paymentMethodsRoutes);
app.use('/api/ical-feeds', icalFeedsRoutes);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const PORT = process.env.PORT || 3000;

async function main() {
  try {
    await prisma.$connect();
    console.log('Database connected successfully');

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

main();
