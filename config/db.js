const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error("✖ MONGODB_URI is missing in your .env file.");
    process.exit(1);
  }

  try {
    mongoose.set("strictQuery", true);
    await mongoose.connect(uri);
    console.log("✔ MongoDB connected:", mongoose.connection.name);
  } catch (err) {
    console.error("✖ MongoDB connection error:", err.message);
    process.exit(1);
  }
}

module.exports = connectDB;
