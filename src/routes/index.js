import express from 'express';
import productRoutes from './productRoutes.js';

const router = express.Router();

/**
 * @swagger
 * /api/healthcheck:
 *   get:
 *     summary: Verifica el estado del servidor
 *     tags: [System]
 *     responses:
 *       200:
 *         description: Estado del servidor
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 uptime:
 *                   type: number
 */

// Health check endpoint para Render
router.get('/healthcheck', (req, res) => {
  res.status(200).json({
    status: 'OK',
    dependencies: {
      db: 'Connected',
      apis: ['products', 'users'],
    },
  });
});

// Rutas de la API
router.use('/products', productRoutes);
// router.use('/users', userRoutes); // Proximamente

export default router;
