import mongoose from 'mongoose';

const MONGODB_URI = 'mongodb://root:b4qbtwz5@dbconn.sealosbja.site:34948/fastgpt-qr-code?directConnection=true&authSource=admin';

if (!MONGODB_URI) {
  throw new Error('请在环境变量中定义 MONGODB_URI');
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts);
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

declare global {
  var mongoose: {
    conn: typeof mongoose | null;
    promise: any;
  };
}
