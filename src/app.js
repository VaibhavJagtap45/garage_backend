// // // app.js
// require("dotenv").config();

// const express = require("express");
// const cors = require("cors");
// const errorHandler = require("./middleware/errorHandler");

// const app = express();   // ⭐ THIS WAS MISSING (main issue)
// app.use(
//   cors({
//     origin: "*",
//     credentials: true,
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//     allowedHeaders: ["Content-Type", "Authorization"],
//   })
// );


// /* ======================================================
//    BODY PARSER
// ====================================================== */
// app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

// /* ======================================================
//    STATIC UPLOADS
// ====================================================== */
// const fs = require("fs");

// if (!fs.existsSync("uploads")) {
//   fs.mkdirSync("uploads");
// }
// app.use("/uploads", express.static("uploads"));
// /* ======================================================
//    HEALTH CHECK ROUTE
//    (You will test this from mobile browser)
// ====================================================== */
// app.get("/", (req, res) => {
//   res.status(200).send("🚗 Garage Backend API Running");
// });

// /* ======================================================
//    ROUTES
// ====================================================== */

// app.use("/api/auth", require("./routes/auth.routes"));
// app.use("/api/users", require("./routes/users.routes"));
// app.use("/api/services", require("./routes/services.routes"));
// app.use("/api/bookings", require("./routes/bookings.routes"));
// app.use("/api/inventory", require("./routes/inventory.routes"));
// app.use("/api/mechanics", require("./routes/mechanics.routes"));
// app.use("/api/coupons", require("./routes/coupon.routes"));
// app.use("/api/fake-payment", require("./routes/fakePayment.routes"));
// app.use("/api/transactions", require("./routes/transactions.routes"));

// // 404 handler (Express 5 )
// app.use((req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Route not found",
//   });
// });
// /* ======================================================
//    GLOBAL ERROR HANDLER
// ====================================================== */
// app.use(errorHandler);

// module.exports = app;


// src/app.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const errorHandler = require("./middlewares/error.middleware");

const app = express();
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ======================================================
   CORS
====================================================== */
app.use(
  cors({
    origin: "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ======================================================
   ⭐ STATIC FILES FIRST
====================================================== */
// app.use("/uploads", express.static(path.join(__dirname, "../uploads")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
/* ======================================================
   ⭐ ROUTES THAT HANDLE FILE UPLOAD (MULTER)
   VERY IMPORTANT — BEFORE BODY PARSER
====================================================== */

app.use("/api/users", require("./routes/users.routes"));
app.use("/api/inventory", require("./routes/inventory.routes"));
app.use("/api/mechanics", require("./routes/mechanics.routes"));

/* ======================================================
   NOW BODY PARSER
====================================================== */

/* ======================================================
   API ROUTES
====================================================== */

app.use("/api/auth", require("./routes/auth.routes"));
// app.use("/api/users", require("./routes/users.routes"));
app.use("/api/services", require("./routes/services.routes"));
app.use("/api/bookings", require("./routes/bookings.routes"));
// app.use("/api/inventory", require("./routes/inventory.routes"));
// app.use("/api/mechanics", require("./routes/mechanics.routes"));
app.use("/api/coupons", require("./routes/coupon.routes"));
app.use("/api/fake-payment", require("./routes/fakePayment.routes"));
app.use("/api/transactions", require("./routes/transactions.routes"));

/* ======================================================
   404 ROUTE HANDLER
====================================================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

/* ======================================================
   GLOBAL ERROR HANDLER (MUST BE LAST)
====================================================== */
app.use(errorHandler);

module.exports = app;