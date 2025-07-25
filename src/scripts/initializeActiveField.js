import mongoose from 'mongoose';
import Product from '../models/Product.js';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI, {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
});

async function runMigration() {
  try {
    console.log('🏃‍♂️ Ejecutando migración...');

    await mongoose.connection.once('open', () => {
      console.log('✅ Conectado a MongoDB');
    });

    const result = await Product.initializeActiveField();
    console.log(
      `✅ Migración completada. Documentos actualizados: ${result.modifiedCount}`
    );
    process.exit(0);
  } catch (error) {
    console.error('❌ Error en migración:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runMigration();
