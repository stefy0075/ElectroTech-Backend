import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ debug: false });

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅ Conectado a MongoDB Atlas');
    return conn;
  } catch (error) {
    console.error('❌ Error al conectar MongoDB:', error);
    process.exit(1);
  }
};

export default connectDB;
