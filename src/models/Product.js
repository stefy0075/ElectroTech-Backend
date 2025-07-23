import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // nombre del producto
    description: { type: String },
    price: { type: Number, required: true },
    category: { type: String, index: true },
    brand: { type: String },
    stock: { type: Number, default: 0 },
    discountPercentage: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    thumbnail: { type: String }, // imagen principal
    images: [{ type: String }], // galería
    // campos personalizados
    cashDiscount: { type: Boolean, default: false },
    oldPrice: { type: Number }, // precio tachado
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
