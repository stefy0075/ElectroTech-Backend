import { MongoClient } from 'mongodb';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';
import dotenv from 'dotenv';

// Setup para __dirname (ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carga el .env desde la raíz del proyecto
dotenv.config({ path: resolve(__dirname, '../../.env') });

const products = JSON.parse(readFileSync(join(__dirname, 'products.json')));
const uri = process.env.MONGODB_URI;

async function upload() {
  const client = new MongoClient(uri);

  try {
    console.log('🔄 Conectando a MongoDB Atlas...');
    await client.connect();

    const db = client.db('electrotech');
    const collection = db.collection('products');

    // Inserta o actualiza por ID, sin borrar todo
    const bulkOps = products.map((product) => ({
      updateOne: {
        filter: { id: product.id },
        update: { $set: product },
        upsert: true,
      },
    }));

    const result = await collection.bulkWrite(bulkOps);
    console.log(
      `✅ ${
        result.upsertedCount + result.modifiedCount
      } productos actualizados/subidos.`
    );
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await client.close();
  }
}

upload();
