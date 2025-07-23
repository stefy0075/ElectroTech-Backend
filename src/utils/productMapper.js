/**
 * Mapea un producto de la API externa al schema de la DB
 * @param {Object} externalProduct - Producto crudo de dummyjson
 * @returns {Object} Producto en formato para MongoDB
 */
export const mapDummyProductToSchema = (externalProduct) => ({
  title: externalProduct.title,
  description: externalProduct.description,
  price: externalProduct.price,
  category: externalProduct.category,
  brand: externalProduct.brand,
  stock: externalProduct.stock,
  discountPercentage: externalProduct.discountPercentage,
  rating: externalProduct.rating,
  thumbnail: externalProduct.thumbnail,
  images: externalProduct.images,
  metadata: {
    keywords: `${externalProduct.category}, ${externalProduct.brand}`,
    source: 'dummyjson',
  },
  cashDiscount: externalProduct.discountPercentage > 15,
  oldPrice: Math.round(
    externalProduct.price * (1 + externalProduct.discountPercentage / 100)
  ),
  createdAt: new Date(),
});

/**
 * Mapea un array de productos externos
 * @param {Array} externalProducts - Array de productos crudos
 * @returns {Array} Array de productos mapeados
 */
export const mapDummyProductsToSchema = (externalProducts) => {
  return externalProducts.map(mapDummyProductToSchema);
};
