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
  registry,
} from './src/monitoring/prometheus.js';

// Router principal
import mainRouter from './src/routes/index.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(metricsMiddleware);

// Conexión a DB
connectDB();

// Ruta principal de la API (todas las rutas llevan /api)
app.use('/api', mainRouter);

// Endpoint de métricas (mantenlo separado)
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', registry.contentType);
    res.end(await getMetrics());
  } catch (err) {
    res.status(500).end('Error en métricas');
  }
});

// Inicio
app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
  console.log(`📊 Métricas en http://localhost:${PORT}/metrics`);
  console.log(`🩺 Health Check en http://localhost:${PORT}/api/healthcheck`);
});
