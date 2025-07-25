import Product from '../models/Product.js';
import ApiError from '../utils/api/ApiError.js';
import { ERROR_MESSAGES } from '../config/constants.js';
import { apiMetrics } from '../monitoring/prometheus.js';

const { dbQueryDuration } = apiMetrics;

export default class ProductService {
  static async createProduct(productData) {
    const endTimer = dbQueryDuration.startTimer({
      collection: 'products',
      operation: 'create',
    });

    try {
      const product = new Product(productData);
      await product.save();
      return product;
    } finally {
      endTimer();
    }
  }

  static async getProducts({ limit = 20, offset = 0, category }) {
    const endTimer = dbQueryDuration.startTimer({
      collection: 'products',
      operation: 'find',
    });

    try {
      const query = {};
      if (category) query.category = category;

      const [products, total] = await Promise.all([
        Product.find(query).skip(offset).limit(limit).lean(),
        Product.countDocuments(query),
      ]);

      return { products, total };
    } finally {
      endTimer();
    }
  }

  static async bulkUpsertProducts(products) {
    const endTimer = dbQueryDuration.startTimer({
      collection: 'products',
      operation: 'bulkUpsert',
    });

    try {
      if (!Array.isArray(products)) {
        throw new ApiError(400, ERROR_MESSAGES.INVALID_DATA);
      }

      const bulkOps = products.map((product) => ({
        updateOne: {
          filter: { id: product.id },
          update: { $set: product },
          upsert: true,
        },
      }));

      const result = await Product.bulkWrite(bulkOps);
      return {
        upsertedCount: result.upsertedCount,
        modifiedCount: result.modifiedCount,
      };
    } finally {
      endTimer();
    }
  }

  static async syncWithExternalApi(apiService) {
    const { products } = await apiService.getProducts({ limit: 100 });
    return this.bulkUpsertProducts(products);
  }
}
