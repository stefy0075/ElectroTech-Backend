import express from 'express';
import {
  getAllProducts,
  createProduct,
  bulkInsertProducts,
  importExternalProducts,
  getProductCategories,
  getDiscountedProducts,
  applyDiscount,
  getCashDiscountProducts,
  getSpecialOffers,
  getFeaturedProducts,
} from '../controllers/productController.js';
import { mapDummyProductsToSchema } from '../utils/mappers/productMapper.js';
import ProductService from '../services/ProductService.js';

const router = express.Router();

// GET /api/products -> todos los productos
router.get('/', getAllProducts);

// GET /api/products/discounted -> productos con descuento
router.get('/discounted', getDiscountedProducts);

// GET /api/products/cashDiscount -> productos con descuento en efectivo
router.get('/cashDiscount', getCashDiscountProducts);

// GET /api/products/specialOffers -> productos con oferta especial
router.get('/specialOffers', getSpecialOffers);

// GET /api/products/featured -> productos destacados/mas vendidos
router.get('/featured', getFeaturedProducts);

// GET /api/products/categories -> todas las categorías
router.get('/categories', getProductCategories);

// POST /api/products/bulk ->  Insertar múltiples productos (Admin)
router.post('/bulk', bulkInsertProducts);

// PATCH /api/products/:id/discount -> Aplicar descuento a un producto específico (Admin)
router.patch('/:id/discount', applyDiscount);

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
