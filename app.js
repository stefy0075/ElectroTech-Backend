import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

import setupSwagger from './src/config/swagger.js';
import { initMetrics, trackRequest } from './src/monitoring/prometheus.js';
import { metricsMiddleware } from './src/monitoring/metricsMiddleware.js';

import connectDB from './src/config/db.js';
import productRoutes from './src/routes/productRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Métricas
initMetrics();

setupSwagger(app);

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(trackRequest);
app.use(metricsMiddleware);

// DB
connectDB();

// Rutas
app.use('/api/products', productRoutes);

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', promClient.register.contentType);
  res.end(await promClient.register.metrics());
});

app.get('/', (req, res) => {
  res.send('Welcome to mi-backend API');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
