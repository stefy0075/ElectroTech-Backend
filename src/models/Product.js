import mongoose from 'mongoose';
import productSchema from './schemas/Product.js';

/**
 * Middlewares/Hooks
 */
productSchema.pre('save', function (next) {
  if (this.isModified('price') && this.oldPrice === undefined) {
    this.oldPrice = this.price;
  }
  next();
});

/**
 * Métodos de Instancia
 */
productSchema.methods = {
  applyDiscount(percentage) {
    if (percentage < 0 || percentage > 100) {
      throw new Error('El descuento debe estar entre 0 y 100');
    }
    this.price = this.price * (1 - percentage / 100);
    return this.save();
  },

  toggleActive() {
    this.active = !this.active;
    return this.save();
  },
};

/**
 * Métodos Estáticos
 */
productSchema.statics = {
  async findByCategory(category, options = {}) {
    const { limit = 10, page = 1 } = options;
    return this.find({ category })
      .limit(limit)
      .skip((page - 1) * limit);
  },

  async getDiscountedProducts(minDiscount = 5) {
    return this.find({
      discountPercentage: { $gte: minDiscount },
      active: true,
    });
  },

  async searchProducts(query) {
    return this.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
  },

  initializeActiveField: async function () {
    return this.updateMany(
      { active: { $exists: false } },
      { $set: { active: true } }
    );
  },

  // Búsqueda por tags
  async getByTag(tag, { page = 1, perPage = 10, minSales = 0 } = {}) {
    const skip = (page - 1) * perPage;

    const [products, total] = await Promise.all([
      this.find({
        active: true,
        tags: tag,
        salesCount: { $gte: minSales },
      })
        .sort({ salesCount: -1 })
        .skip(skip)
        .limit(perPage),

      this.countDocuments({
        active: true,
        tags: tag,
        salesCount: { $gte: minSales },
      }),
    ]);

    return {
      products,
      total,
      totalPages: Math.ceil(total / perPage),
      currentPage: page,
      perPage,
    };
  },

  // Versión para múltiples tags
  async getByTags(
    tags,
    { page = 1, perPage = 10, sortBy = 'salesCount', sortOrder = 'desc' } = {}
  ) {
    const skip = (page - 1) * perPage;
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [products, total] = await Promise.all([
      this.find({
        active: true,
        tags: { $in: tags },
      })
        .sort(sort)
        .skip(skip)
        .limit(perPage),

      this.countDocuments({
        active: true,
        tags: { $in: tags },
      }),
    ]);

    return {
      products,
      total,
      totalPages: Math.ceil(total / perPage),
      currentPage: page,
      perPage,
      sortBy,
      sortOrder,
    };
  },
};

const Product = mongoose.model('Product', productSchema, 'products');
export default Product;
