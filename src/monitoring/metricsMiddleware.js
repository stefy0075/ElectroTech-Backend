import promClient from 'prom-client';

// 1. Configura métricas por defecto (CPU, memoria, etc.)
const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({
  timeout: 5000,
  prefix: 'electrotech_', // 👈 Evita colisiones con otras apps
  labels: { app: 'electrotech-backend' },
});

// 2. Crea métricas personalizadas (mejor como singleton)
const requestCounter = new promClient.Counter({
  name: 'electrotech_http_requests_total',
  help: 'Total de requests HTTP',
  labelNames: ['method', 'route', 'status'],
});

const apiResponseTime = new promClient.Histogram({
  name: 'electrotech_api_response_time_seconds',
  help: 'Tiempo de respuesta de la API',
  labelNames: ['route'],
  buckets: [0.1, 0.5, 1, 2, 5], // 👈 Rangos personalizados
});

// 3. Exporta métricas y middleware
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

// Middleware para Express
export const metricsMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    metrics.observeResponseTime(req.path, duration);
    metrics.increment('http_requests', 1, {
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode,
    });
  });

  next();
};
