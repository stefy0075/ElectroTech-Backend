import promClient from 'prom-client';
import { METRICS_ENABLED } from '../config/constants.js';

// Crea un registro separado para métricas custom
export const registry = new promClient.Registry();

// Métricas de la aplicación
export const apiMetrics = {
  httpRequestDuration: new promClient.Histogram({
    name: 'app_http_request_duration_seconds',
    help: 'Duración de las solicitudes HTTP en segundos',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.5, 1, 2, 5],
    registers: [registry],
  }),
  dbQueryDuration: new promClient.Histogram({
    name: 'app_db_query_duration_seconds',
    help: 'Duración de consultas a MongoDB en segundos',
    labelNames: ['collection', 'operation'],
    buckets: [0.01, 0.05, 0.1, 0.5, 1],
    registers: [registry],
  }),
};

// Función para habilitar/deshabilitar métricas
export const initMetrics = () => {
  if (METRICS_ENABLED) {
    promClient.collectDefaultMetrics({
      register: registry,
      prefix: 'app_',
      timeout: 5000,
    });
  }
};

// Middleware para tracking de requests
export const trackRequest = (req, res, next) => {
  if (!METRICS_ENABLED) return next();

  const start = Date.now();
  const timer = apiMetrics.httpRequestDuration.startTimer({
    method: req.method,
    route: req.route?.path || req.path,
  });

  res.on('finish', () => {
    timer({ status: res.statusCode });
    console.log(`Request ${req.method} ${req.path} - ${Date.now() - start}ms`);
  });

  next();
};
