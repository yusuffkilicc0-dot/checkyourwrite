import mongoose from 'mongoose';

// Vercel serverless function'lar her istekte yeniden çalışabilir.
// Bağlantıyı global'de tutup tekrar tekrar açmayı önlüyoruz.
let cached = global._mongoose;
if (!cached) {
  cached = global._mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) throw new Error('MONGODB_URI tanimli degil.');

    cached.promise = mongoose.connect(uri, {
      bufferCommands: false,
    }).then((m) => m);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
