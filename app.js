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

// Middlewares básicos
app.use(cors());
app.use(bodyParser.json());
app.use(metricsMiddleware);

// Middleware de timeout
app.use((req, res, next) => {
  req.setTimeout(10000, () => {
    res.status(504).json({ error: 'Timeout' });
  });
  next();
});

// Health Check para Render
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    db: mongoose.connection?.readyState === 1 ? 'Connected' : 'Disconnected', // Opcional
  });
});

// Configuración de Swagger
setupSwagger(app);

// Conexión a la base de datos
connectDB();

// Rutas principales
app.use('/api', mainRouter);

// Endpoint de métricas
app.get('/metrics', async (req, res) => {
  try {
    res.set('Content-Type', registry.contentType);
    res.end(await getMetrics());
  } catch (err) {
    res.status(500).end('Error en métricas');
  }
});

// Inicio del servidor con configuraciones de timeout
const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor en puerto ${PORT}`);
  console.log(`📊 Métricas en http://localhost:${PORT}/metrics`);
  console.log(`📚 Swagger UI en http://localhost:${PORT}/api-docs`);
  console.log(`🩺 Health Check en http://localhost:${PORT}/health`);
});

// Optimización de conexiones HTTP
server.keepAliveTimeout = 60000;
server.headersTimeout = 65000;
