import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

// Configuración
import setupSwagger from './src/config/swagger.js';
import connectDB from './src/config/db.js';

// Métricas
import {
  metricsMiddleware,
  getMetrics,
  apiMetrics,
  registry,
} from './src/monitoring/prometheus.js';

// Rutas
import productRoutes from './src/routes/productRoutes.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(metricsMiddleware);

// Conexión a DB
connectDB();

// Rutas
app.use('/api/products', productRoutes);

// Endpoint de métricas
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', registry.contentType);
    res.end(await getMetrics());
  } catch (err) {
    res.status(500).end('Error en métricas');
  }
});

// Middleware de conexiones activas
app.use((req, res, next) => {
  apiMetrics.activeConnections.inc();
  res.on('finish', () => apiMetrics.activeConnections.dec());
  next();
});

// Inicio
app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
  console.log(`📊 Métricas en http://localhost:${PORT}/metrics`);
});
