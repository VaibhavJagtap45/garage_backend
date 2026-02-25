// src/middleware/errorHandler.js

const errorHandler = (err, req, res, next) => {
  console.log("=================================");
  console.log("🚨 GLOBAL ERROR HANDLER TRIGGERED");
  console.log(err);
  console.log("=================================");

  /* ---------------- MULTER ERROR ---------------- */
  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: "File upload failed",
      error: err.message,
    });
  }

  /* ---------------- MONGOOSE INVALID OBJECT ID ---------------- */
  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource ID",
    });
  }

  /* ---------------- DUPLICATE KEY (EMAIL EXISTS) ---------------- */
  if (err.code === 11000) {
    return res.status(400).json({
      success: false,
      message: "Email already registered",
    });
  }

  /* ---------------- JWT TOKEN ERROR ---------------- */
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }

  /* ---------------- DEFAULT ---------------- */
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;