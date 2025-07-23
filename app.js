import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

import setupSwagger from './src/config/swagger.js';
import metricsMiddleware from './src/config/metricsMiddleware.js';

import connectDB from './src/config/db.js';
import productRoutes from './src/routes/productRoutes.js';
import userRoutes from './src/routes/userRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

setupSwagger(app);

// Middlewares
app.use(cors());
app.use(bodyParser.json());

// DB
connectDB();

// Rutas
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to mi-backend API');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
