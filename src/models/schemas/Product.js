import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    // Campos básicos
    id: { type: Number, required: true, unique: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true },
    category: { type: String, required: true, index: true },
    brand: { type: String, required: true },

    // Inventario
    stock: { type: Number, required: true, default: 0 },
    discountPercentage: { type: Number, required: true, default: 0 },
    rating: { type: Number, required: true, default: 0 },

    // Multimedia
    thumbnail: { type: String, required: true },
    images: [{ type: String, required: true }],

    // Clasificación
    tags: [{ type: String, required: true }],

    // Especificaciones
    sku: { type: String, required: true },
    weight: { type: Number, required: true },
    dimensions: {
      width: { type: Number, required: true },
      height: { type: Number, required: true },
      depth: { type: Number, required: true },
    },

    // Información comercial
    warrantyInformation: { type: String, required: true },
    shippingInformation: { type: String, required: true },
    availabilityStatus: { type: String, required: true },

    // Reseñas
    reviews: [
      {
        rating: { type: Number, required: true },
        comment: { type: String, required: true },
        date: { type: Date, required: true },
        reviewerName: { type: String, required: true },
        reviewerEmail: { type: String, required: true },
      },
    ],

    // Políticas
    returnPolicy: { type: String, required: true },
    minimumOrderQuantity: { type: Number, required: true },

    // Metadatos
    meta: {
      createdAt: { type: Date, required: true },
      updatedAt: { type: Date, required: true },
      barcode: { type: String, required: true },
      qrCode: { type: String, required: true },
    },

    // Configuraciones
    cashDiscount: { type: Boolean, default: false },
    oldPrice: { type: Number },
    active: { type: Boolean, default: true },
    salesCount: { type: Number, default: 0, index: true },
  },
  {
    timestamps: true,
    _id: false,
  }
);

// Índices adicionales
productSchema.index({ title: 'text', description: 'text' }); // Búsqueda por texto
productSchema.index({ category: 1, brand: 1 }); // Búsqueda por categoría y marca
productSchema.index({ active: 1, discountPercentage: -1 }); // Búsqueda por descuento
productSchema.index({ active: 1, salesCount: -1 }); // Búsqueda por productos mas vendidos
productSchema.index({ active: 1, cashDiscount: 1 }); // Búsqueda por descuento en efectivo

// índices para búsqueda por tags
productSchema.index({ tags: 1 }); // Búsqueda básica por tags
productSchema.index({ active: 1, tags: 1 }); // Búsqueda de activos por tag
productSchema.index({ active: 1, tags: 1, salesCount: -1 }); // Para mejores ventas por tag

export default productSchema;
