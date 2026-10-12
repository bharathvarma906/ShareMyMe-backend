const mongoose = require('mongoose');
const dns = require('dns');

// Configure reliable DNS servers (Google & Cloudflare) to avoid querySrv ECONNREFUSED on ISPs/Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (dnsErr) {
  // Fallback gracefully if custom DNS servers cannot be set
}

const connectionState = {
  status: 'disconnected',
  error: null,
  uriConfigured: false,
  maskedUri: '',
};

const connectDB = async () => {
  let mongoUri = process.env.MONGO_URI;
  connectionState.uriConfigured = Boolean(mongoUri);

  if (!mongoUri) {
    mongoUri = 'mongodb://127.0.0.1:27017/sharemymeal';
    connectionState.error = 'MONGO_URI is not defined in environment variables. Defaulting to local MongoDB.';
  }

  // Auto-clean accidental angle brackets around password: e.g. :<mypassword>@ -> :mypassword@
  if (mongoUri.includes(':<') && mongoUri.includes('>@')) {
    mongoUri = mongoUri.replace(':<', ':').replace('>@', '@');
  }

  connectionState.maskedUri = mongoUri.replace(/:([^@]+)@/, ':****@');

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging indefinitely
    });
    connectionState.status = 'connected';
    connectionState.error = null;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    connectionState.status = 'error';
    connectionState.error = error.message;
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('💡 Make sure MONGO_URI in Render Environment is valid and Network Access allows 0.0.0.0/0');

    // Auto-retry connection after 5 seconds
    setTimeout(connectDB, 5000);
  }
};

module.exports = { connectDB, connectionState };

