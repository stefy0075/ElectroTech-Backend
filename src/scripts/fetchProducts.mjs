import { writeFileSync } from 'fs';
import axios from 'axios';

const categories = [
  'smartphones',
  'laptops',
  'tablets',
  'mens-watches',
  'womens-watches',
  'mobile-accessories',
  'motorcycle',
];

async function fetchProducts() {
  try {
    let allProducts = [];
    for (const category of categories) {
      const response = await axios.get(
        `https://dummyjson.com/products/category/${category}`
      );
      allProducts = [...allProducts, ...response.data.products];
    }
    writeFileSync('products.json', JSON.stringify(allProducts, null, 2));
    console.log('✅ Productos guardados en products.json');
  } catch (error) {
    console.error('❌ Error al obtener productos:', error.message);
  }
}

fetchProducts();
