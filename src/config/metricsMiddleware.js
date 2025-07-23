import promClient from 'prom-client';

const collectDefaultMetrics = promClient.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

export const metrics = {
  increment: (name, value = 1) => {
    if (process.env.METRICS_ENABLED === 'true') {
      const counter = new promClient.Counter({ name, help: name });
      counter.inc(value);
    }
  },
  gauge: (name, value) => {
    if (process.env.METRICS_ENABLED === 'true') {
      const gauge = new promClient.Gauge({ name, help: name });
      gauge.set(value);
    }
  },
};

export default metrics;
