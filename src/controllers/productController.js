import Product from '../models/Product.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/ApiError.js';
import apiService from '../services/externalApiService.js';
import { mapDummyProductsToSchema } from '../utils/productMapper.js';
import metrics from '../config/metricsMiddleware.js'; // Opcional para métricas

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Obtiene todos los productos activos
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de productos
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.find({ active: true }).lean();
  res
    .status(200)
    .json(new ApiResponse(200, products, 'Productos obtenidos exitosamente'));
});

/**
 * @swagger
 * /api/products:
 *   post:
 *     summary: Crea un nuevo producto (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Producto creado exitosamente
 */
const createProduct = asyncHandler(async (req, res) => {
  const { title, price, category } = req.body;

  if (!title || !price || !category) {
    throw new ApiError(400, 'Faltan campos requeridos: title, price, category');
  }

  const product = await Product.create(req.body);
  res
    .status(201)
    .json(new ApiResponse(201, product, 'Producto creado exitosamente'));
});

/**
 * @swagger
 * /api/products/bulk:
 *   post:
 *     summary: Inserta múltiples productos (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               products:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Product'
 *     responses:
 *       201:
 *         description: Productos insertados
 */
const bulkInsertProducts = asyncHandler(async (req, res) => {
  const { products } = req.body;

  if (!Array.isArray(products)) {
    throw new ApiError(
      400,
      'Formato inválido: se esperaba un array "products"'
    );
  }

  const result = await Product.insertMany(products, {
    ordered: false,
    rawResult: true,
  });

  res.status(201).json(
    new ApiResponse(
      201,
      {
        insertedCount: result.insertedCount,
        duplicates: result?.writeErrors?.length || 0,
      },
      `${result.insertedCount} productos importados`
    )
  );
});

/**
 * @swagger
 * /api/products/import-external:
 *   post:
 *     summary: Importa productos desde API externa
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Productos importados exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     importedCount:
 *                       type: number
 *                     sample:
 *                       type: string
 *                 message:
 *                   type: string
 *       502:
 *         description: Error al conectar con la API externa
 */
const importExternalProducts = asyncHandler(async (req, res) => {
  const session = await Product.startSession();
  session.startTransaction();

  try {
    // Paso 1: Obtener productos de la API externa
    const { products } = await apiService.getProducts({ limit: 100 });

    // Paso 2: Mapear al schema de la DB
    const mappedProducts = mapDummyProductsToSchema(products);

    if (!mappedProducts.length) {
      throw new ApiError(404, 'No se encontraron productos para importar');
    }

    // Paso 3: Transacción atómica (borrar antiguos + insertar nuevos)
    await Product.deleteMany({ 'metadata.source': 'dummyjson' }).session(
      session
    );
    const result = await Product.insertMany(mappedProducts, { session });
    await session.commitTransaction();

    // Métricas 
    if (metrics) {
      metrics.increment('product.import.external', result.length);
      metrics.gauge('product.total.external', result.length);
    }

    res.status(201).json(
      new ApiResponse(
        201,
        {
          importedCount: result.length,
          sample: result[0]?.title,
        },
        `Importación exitosa: ${result.length} productos`
      )
    );
  } catch (error) {
    await session.abortTransaction();
    console.error('Error en importExternalProducts:', error);
    throw new ApiError(
      502,
      'Error al importar productos',
      process.env.NODE_ENV === 'development' ? error.message : null
    );
  } finally {
    session.endSession();
  }
});

export {
  getAllProducts,
  createProduct,
  bulkInsertProducts,
  importExternalProducts,
};
