const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers (Google & Cloudflare) to avoid querySrv ECONNREFUSED on ISPs/Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // Fallback gracefully if custom DNS servers cannot be set
}

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
