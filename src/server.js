// // MUST BE FIRST (loads .env before anything else)
// require("dotenv").config();

// const app = require("./app");
// const connectDB = require("./config/db");

// // connect database
// connectDB();

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`🚀 Server running on http://localhost:${PORT}`);
// });










// server.js

// 1️⃣ Load environment variables FIRST
require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

/* =========================
   CONNECT DATABASE
========================= */
const startServer = async () => {
  try {
    // connect mongo
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
      console.log("=================================");
      console.log(`🚀 Server running on PORT ${PORT}`);
      console.log(`🌍 http://localhost:${PORT}`);
      console.log("=================================");
    });
  } catch (err) {
    console.error("Server failed to start:");
    console.error(err);
    process.exit(1);
  }
};

startServer();