// src/server.js

require("dotenv").config();
const mongoose = require("mongoose");
const app = require("./app");

/* ======================================================
   CONNECT DATABASE
====================================================== */
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("=================================");
    console.log("✅ MongoDB Connected Successfully");
    console.log("=================================");
  } catch (err) {
    console.error("❌ MongoDB Connection Failed");
    console.error(err.message);
    process.exit(1);
  }
};

/* ======================================================
   START SERVER
====================================================== */
const startServer = async () => {
  await connectDB();

  const PORT = process.env.PORT || 5000;

  // For local development with mobile: 0.0.0.0
  // For production (Railway, Heroku) use app.listen(PORT)
  // app.listen(PORT, "0.0.0.0", () => {
    app.listen(PORT, () => {
    console.log("=================================");
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`💻 Localhost: http://localhost:${PORT}`);
    // Dynamically determine local IP for mobile testing (optional)
    // const { networkInterfaces } = require("os");
    // const nets = networkInterfaces();
    // for (const name of Object.keys(nets)) {
    //   for (const net of nets[name]) {
    //     if (net.family === "IPv4" && !net.internal) {
    //       console.log(`📱 Mobile access: http://${net.address}:${PORT}`);
    //       break;
    //     }
    //   }
    // }
    console.log("=================================");
  });
};

startServer();