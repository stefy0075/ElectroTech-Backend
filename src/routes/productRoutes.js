import express from 'express';
import {
  getAllProducts,
  createProduct,
  bulkInsertProducts,
  importExternalProducts,
} from '../controllers/productController.js';
import { mapDummyProductsToSchema } from '../utils/mappers/productMapper.js';
import ProductService from '../services/ProductService.js';

const router = express.Router();

// GET /api/products -> todos los productos
router.get('/', getAllProducts);

// POST /api/products -> crear uno (admin)
router.post('/', createProduct);

// POST /api/products/sync-dummy
router.post('/sync-dummy', importExternalProducts);

// Alternativa para mantener la ruta separada:
router.post('/sync-legacy', async (req, res, next) => {
  try {
    const { products } = await ProductService.getProducts({ limit: 100 });
    const mappedProducts = mapDummyProductsToSchema(products);
    await bulkInsertProducts({ body: { products: mappedProducts } }, res);
  } catch (error) {
    console.error('Error en sync-legacy:', error);
    res.status(502).json({ error: 'Error al sincronizar productos' });
  }
});

export default router;
