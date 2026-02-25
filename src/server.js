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

  // IMPORTANT: 0.0.0.0 allows mobile devices to connect
  app.listen(PORT, "0.0.0.0", () => {
    console.log("=================================");
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`💻 Localhost: http://localhost:${PORT}`);
    console.log(`📱 Mobile access: http://192.168.0.101:${PORT}`);
    console.log("=================================");
  });
};

startServer();






// require("dotenv").config();
// const mongoose = require("mongoose");
// const app = require("./app");

// /* ======================================================
//    CONNECT DATABASE
// ====================================================== */

// const connectDB = async () => {
//   try {
//     await mongoose.connect(process.env.MONGO_URI);

//     console.log("=================================");
//     console.log("✅ MongoDB Connected Successfully");
//     console.log("=================================");
//   } catch (err) {
//     console.error("❌ MongoDB Connection Failed");
//     console.error(err.message);
//     process.exit(1);
//   }
// };

// /* ======================================================
//    START SERVER
// ====================================================== */

// const startServer = async () => {
//   await connectDB();

//   const PORT = process.env.PORT || 5000;

//   // Railway requires binding to 0.0.0.0
//   app.listen(PORT, () => {
//     console.log("=================================");
//     console.log(`🚀 Server running on port ${PORT}`);
//     console.log("=================================");
//   });
// };

// startServer();