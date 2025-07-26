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

// Health Check (Agrégalo aquí)
router.get('/healthcheck', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    externalApi: await checkExternalServices(),
    // ...otros checks
  };

  const allOk = Object.values(checks).every((v) => v);
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'OK' : 'Service Unavailable',
    checks,
    timestamp: new Date(),
  });
});

// Rutas de la API
router.use('/products', productRoutes);
// router.use('/users', userRoutes); // Proximamente

export default router;
