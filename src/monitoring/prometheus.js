import promClient from 'prom-client';
import { METRICS_ENABLED } from '../config/constants.js';

// Configuración del Registro
export const registry = new promClient.Registry();

// Métricas por Defecto
if (METRICS_ENABLED) {
  promClient.collectDefaultMetrics({
    register: registry,
    prefix: 'electrotech_',
    timeout: 5000,
    labels: { app: 'electrotech-backend' },
  });
}

// Métricas Personalizadas
export const apiMetrics = {
  httpRequests: new promClient.Counter({
    name: 'electrotech_http_requests_total',
    help: 'Total de requests HTTP',
    labelNames: ['method', 'route', 'status'],
    registers: [registry],
  }),
  httpDuration: new promClient.Histogram({
    name: 'electrotech_http_duration_seconds',
    help: 'Duración de requests HTTP',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [registry],
  }),
  dbQueryDuration: new promClient.Histogram({
    name: 'electrotech_db_query_seconds',
    help: 'Duración de consultas a DB',
    labelNames: ['collection', 'operation'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1],
    registers: [registry],
  }),
  activeConnections: new promClient.Gauge({
    name: 'electrotech_active_connections',
    help: 'Conexiones activas',
    registers: [registry],
  }),
};

// Exporta métricas y middleware
export const metrics = {
  increment: (name, value = 1, labels = {}) => {
    if (process.env.METRICS_ENABLED === 'true') {
      requestCounter.inc(labels, value);
    }
  },
  observeResponseTime: (route, timeInSeconds) => {
    if (process.env.METRICS_ENABLED === 'true') {
      apiResponseTime.observe({ route }, timeInSeconds);
    }
  },
};

// Middleware de Métricas
export const metricsMiddleware = (req, res, next) => {
  if (!METRICS_ENABLED) return next();

  const start = Date.now();
  const route = req.route?.path || req.path;

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;

    apiMetrics.httpRequests.inc({
      method: req.method,
      route,
      status: res.statusCode,
    });

    apiMetrics.httpDuration.observe(
      {
        method: req.method,
        route,
        status: res.statusCode,
      },
      duration
    );
  });

  next();
};

// Función para obtener métricas
export const getMetrics = async () => {
  return METRICS_ENABLED ? registry.metrics() : '';
};
