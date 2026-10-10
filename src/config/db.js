const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/sharemymeal';
    const conn = await mongoose.connect(mongoUri);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('💡 Make sure MongoDB service is running locally, or update MONGO_URI in .env with a valid MongoDB Atlas connection string.');
    // We don't hard exit so backend server can still run and return helpful errors if MongoDB is offline
  }
};

module.exports = connectDB;
