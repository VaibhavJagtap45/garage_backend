// // app.js
// const express = require("express");
// const cors = require("cors");
// const path = require("path");
// const errorHandler = require("./middlewares/error.middleware");
// // const cors = require("cors");
// // app.use(cors());
// const app = express();

// /* =========================
//    GLOBAL MIDDLEWARES
// ========================= */

// // // CORS (allow frontend / mobile apps)
// app.use(
//   cors({
//     origin: "*", // later you can restrict to your frontend domain
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     credentials: true,
//   })
// );

// // Body parser
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// /* =========================
//    STATIC FILES (UPLOADS)
// ========================= */
// // images will be accessible:
// // http://localhost:5000/uploads/filename.jpg
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// /* =========================
//    HEALTH CHECK
// ========================= */
// app.get("/", (req, res) => {
//   res.send("🚗 Garage Backend API Running");
// });

// /* =========================
//    ROUTES
// ========================= */

// app.use("/api/auth", require("./routes/auth.routes"));
// app.use("/api/users", require("./routes/users.routes"));
// app.use("/api/services", require("./routes/services.routes"));
// app.use("/api/bookings", require("./routes/bookings.routes"));
// app.use("/api/inventory", require("./routes/inventory.routes"));
// app.use("/api/mechanics", require("./routes/mechanics.routes"));
// app.use("/api/coupons", require("./routes/coupon.routes"));
// app.use("/api/fake-payment", require("./routes/fakePayment.routes"));
// app.use("/api/transactions", require("./routes/transactions.routes"));
// /* =========================
//    404 HANDLER
// ========================= */
// app.use((req, res) => {
//   res.status(404).json({ message: "Route not found" });
// });


// /* =========================
//    GLOBAL ERROR HANDLER
// ========================= */
// app.use(errorHandler);


// const fs = require("fs");
// console.log("Routes folder exists:", fs.existsSync(__dirname + "/routes"));
// console.log("fakePayment exists:", fs.existsSync(__dirname + "/routes/fakePayment.routes.js"));


// module.exports = app;



























// src/app.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const errorHandler = require("./middlewares/error.middleware");
const app = express();

/* ======================================================
   VERY IMPORTANT — CORS (React Native will fail without)
====================================================== */

// Allow every device on same WiFi network
// app.use(
//   cors({
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );

// handle preflight requests (THIS FIXES "Network request failed")
// app.options("*", cors());
// Handle preflight manually (Express 5 compatible)
// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", "*");
//   res.header("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
//   res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

//   if (req.method === "OPTIONS") {
//     return res.sendStatus(200);
//   }

//   next();
// });


app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Proper preflight support (EXPRESS 5 FIX)
app.options("*", cors());
/* ======================================================
   BODY PARSER
====================================================== */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ======================================================
   STATIC UPLOADS
====================================================== */
// app.use("/uploads", express.static(path.join(__dirname, "uploads")));

/* serve uploaded files */
// app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
const fs = require("fs");

if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}
app.use("/uploads", express.static("uploads"));
/* ======================================================
   HEALTH CHECK ROUTE
   (You will test this from mobile browser)
====================================================== */
app.get("/", (req, res) => {
  res.status(200).send("🚗 Garage Backend API Running");
});

/* ======================================================
   ROUTES
====================================================== */

app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/services", require("./routes/services.routes"));
app.use("/api/bookings", require("./routes/bookings.routes"));
app.use("/api/inventory", require("./routes/inventory.routes"));
app.use("/api/mechanics", require("./routes/mechanics.routes"));
app.use("/api/coupons", require("./routes/coupon.routes"));
app.use("/api/fake-payment", require("./routes/fakePayment.routes"));
app.use("/api/transactions", require("./routes/transactions.routes"));
// app.use("/api/users", require("./routes/users.routes"));
// app.use("/api/bookings", bookingRoutes);
/* ======================================================
   404 HANDLER
====================================================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

/* ======================================================
   GLOBAL ERROR HANDLER
====================================================== */
app.use(errorHandler);

module.exports = app;