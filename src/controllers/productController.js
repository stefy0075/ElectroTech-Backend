import { Product } from '../models/index.js';
import ApiResponse from '../utils/api/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js';
import ApiError from '../utils/api/ApiError.js';
import { mapDummyProductsToSchema } from '../utils/mappers/productMapper.js';
import { metrics } from '../monitoring/prometheus.js';

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Obtiene todos los productos activos
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filtrar por categoría
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Búsqueda textual en título y descripción
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Límite de resultados por página
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página para paginación
 *     responses:
 *       200:
 *         description: Lista de productos activos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     products:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Product'
 *                     total:
 *                       type: integer
 *                       description: Total de productos activos
 *       400:
 *         description: Parámetros de búsqueda inválidos
 */
const getAllProducts = asyncHandler(async (req, res) => {
  //Testeado OK
  const { limit = 10, page = 1, category, search } = req.query;

  let products, total;
  const baseFilter = { active: true };

  if (search) {
    products = await Product.find({
      ...baseFilter,
      $text: { $search: search },
    }).sort({ score: { $meta: 'textScore' } });
    total = await Product.countDocuments({
      ...baseFilter,
      $text: { $search: search },
    });
  } else if (category) {
    products = await Product.find({
      ...baseFilter,
      category,
    })
      .limit(limit)
      .skip((page - 1) * limit);
    total = await Product.countDocuments({
      ...baseFilter,
      category,
    });
  } else {
    products = await Product.find(baseFilter)
      .limit(limit)
      .skip((page - 1) * limit);
    total = await Product.countDocuments(baseFilter);
  }

  res.json(new ApiResponse(200, { products, total }));
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
    // Obtiene productos de la API externa
    const { products } = await apiService.getProducts({ limit: 100 });

    // Mapea al schema de la DB
    const mappedProducts = mapDummyProductsToSchema(products);

    if (!mappedProducts.length) {
      throw new ApiError(404, 'No se encontraron productos para importar');
    }

    // Transacción atómica (borrar antiguos + insertar nuevos)
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

/**
 * @swagger
 * /api/products/discounted:
 *   get:
 *     summary: Obtiene productos activos con descuento
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: min_discount
 *         schema:
 *           type: number
 *           minimum: 0
 *           maximum: 100
 *           default: 5
 *         description: Descuento mínimo requerido (0-100%)
 *     responses:
 *       200:
 *         description: Lista de productos activos con descuento
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *       404:
 *         description: No se encontraron productos con descuento
 */
const getDiscountedProducts = asyncHandler(async (req, res) => {
  //Testeado OK
  const minDiscount = req.query.min_discount || 5;
  const products = await Product.find({
    discountPercentage: { $gte: Number(minDiscount) },
    active: true,
  });

  if (!products || products.length === 0) {
    throw new ApiError(
      404,
      'No se encontraron productos activos con descuento'
    );
  }

  res.json(new ApiResponse(200, products));
});

/**
 * @swagger
 * /api/products/{id}/discount:
 *   patch:
 *     summary: Aplica descuento a un producto
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               percentage:
 *                 type: number
 *                 minimum: 0
 *                 maximum: 100
 *     responses:
 *       200:
 *         description: Descuento aplicado
 */
const applyDiscount = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id);
  if (!product) {
    throw new ApiError(404, 'Producto no encontrado');
  }

  // Usar el nuevo método de instancia
  await product.applyDiscount(req.body.percentage);

  res.json(new ApiResponse(200, product, 'Descuento aplicado correctamente'));
});

/**
 * @swagger
 * /api/products/categories:
 *   get:
 *     summary: Obtiene todas las categorías únicas de productos
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: Lista de categorías
 */
const getProductCategories = asyncHandler(async (req, res) => {
  const categories = await Product.distinct('category');
  res.json(new ApiResponse(200, categories));
});
//Agregar filtro active, para publico, en admin no.
//const getProductCategories = asyncHandler(async (req, res) => {
//const filter = req.user?.isAdmin ? {} : { active: true }; // Filtra solo si no es admin
//const categories = await Product.distinct('category', filter);
//res.json(new ApiResponse(200, categories));
//});

export {
  getAllProducts,
  createProduct,
  bulkInsertProducts,
  importExternalProducts,
  getDiscountedProducts,
  applyDiscount,
  getProductCategories,
};
