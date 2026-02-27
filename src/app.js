// src/app.js

require("dotenv").config();

const express = require("express");
const cors = require("cors");
const path = require("path");
const helmet = require("helmet"); // optional security middleware

const errorHandler = require("./middlewares/error.middleware");

const app = express();

/* ======================================================
   SECURITY MIDDLEWARE (optional but recommended)
====================================================== */
app.use(helmet());

/* ======================================================
   CORS – restrict in production
====================================================== */
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*", // set your frontend URL in production
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

/* ======================================================
   STATIC FILES – serve uploads
====================================================== */
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

/* ======================================================
   IMPORTANT: MULTER ROUTES FIRST (they handle multipart)
====================================================== */
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/inventory", require("./routes/inventory.routes"));

/* ======================================================
   BODY PARSER – for JSON and URL-encoded (after multer)
====================================================== */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/* ======================================================
   OTHER ROUTES (JSON only)
====================================================== */
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/services", require("./routes/services.routes"));
app.use("/api/bookings", require("./routes/bookings.routes"));
app.use("/api/coupons", require("./routes/coupon.routes"));
app.use("/api/fake-payment", require("./routes/fakePayment.routes"));
app.use("/api/transactions", require("./routes/transactions.routes"));
app.use("/api/mechanics", require("./routes/mechanics.routes"));
app.use("/api/mechanic-requests", require("./routes/mechanicRequest.routes"));
/* ======================================================
   404 HANDLER
====================================================== */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}`,
  });
});

/* ======================================================
   GLOBAL ERROR HANDLER
====================================================== */
app.use(errorHandler);

module.exports = app;