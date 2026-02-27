const errorHandler = (err, req, res, next) => {
  console.log("=================================");
  console.log("🚨 GLOBAL ERROR HANDLER TRIGGERED");
  console.log(err);
  console.log("=================================");

  if (err.name === "MulterError") {
    return res.status(400).json({
      success: false,
      message: "File upload failed",
      error: err.message,
    });
  }

  if (err.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid resource ID",
    });
  }

  if (err.code === 11000) {
    // Improve message to show which field is duplicate
    const field = Object.keys(err.keyPattern)[0];
    return res.status(400).json({
      success: false,
      message: `${field} already exists`,
    });
  }

  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token. Please login again.",
    });
  }

  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;