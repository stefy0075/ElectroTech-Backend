import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

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

// Configuración inicial
dotenv.config();
const app = express();
const PORT = process.env.PORT;

// Middlewares
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

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date(),
    uptime: process.uptime(),
    db: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
  });
});

// Configuración de Swagger
setupSwagger(app);

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

// Función para iniciar el servidor
const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, '0.0.0.0', () => {
      const isProduction = process.env.NODE_ENV === 'production';
      const baseUrl = isProduction
        ? process.env.RENDER_EXTERNAL_URL
        : `http://localhost:${PORT}`;

      const line = '═'.repeat(40);
      console.log(`\n${line}`);
      console.log(
        `🚀 Servidor ${isProduction ? 'PRODUCCIÓN' : 'development'} iniciado`
      );
      console.log(line);
      console.log(`🌐 URL Base:      ${baseUrl}`);
      !isProduction && console.log(`📊 Métricas:      ${baseUrl}/metrics`);
      console.log(`📚 Documentación: ${baseUrl}/api-docs`);
      console.log(`🩺 Health Check:  ${baseUrl}/health`);
      console.log(line + '\n');
    });

    // Configuración de timeouts
    server.keepAliveTimeout = 60000;
    server.headersTimeout = 65000;

    return server;
  } catch (error) {
    console.error('⛔ Error al iniciar el servidor:', error);
    process.exit(1);
  }
};

// Iniciar aplicación
(async () => {
  try {
    await startServer();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();
