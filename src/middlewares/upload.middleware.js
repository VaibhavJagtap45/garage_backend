const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* =====================================================
   CREATE FOLDERS
===================================================== */

const baseUpload = path.join(__dirname, "..", "uploads");
const avatarPath = path.join(baseUpload, "avatars");
const partsPath = path.join(baseUpload, "parts");
const bikesPath = path.join(baseUpload, "bikes");

[baseUpload, avatarPath, partsPath, bikesPath].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/* =====================================================
   DYNAMIC STORAGE (VERY IMPORTANT)
===================================================== */

const storage = multer.diskStorage({

  destination: (req, file, cb) => {

    // Decide folder based on route
    if (req.originalUrl.includes("inventory")) {
      // inventory item image
      return cb(null, partsPath);
    }

    if (req.originalUrl.includes("bike")) {
      // bike image (future)
      return cb(null, bikesPath);
    }

    // default: avatar
    return cb(null, avatarPath);
  },

  filename: (req, file, cb) => {

    const ext = path.extname(file.originalname || ".jpg");

    let prefix = "file";

    if (req.originalUrl.includes("inventory")) prefix = "part";
    else if (req.originalUrl.includes("bike")) prefix = "bike";
    else prefix = "avatar";

    const uniqueName =
      prefix +
      "_" +
      (req.user?._id || "guest") +
      "_" +
      Date.now() +
      ext;

    cb(null, uniqueName);
  },
});

/* =====================================================
   FILTER
===================================================== */

const fileFilter = (req, file, cb) => {
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files allowed"), false);
  }
  cb(null, true);
};

/* =====================================================
   EXPORT
===================================================== */

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// module.exports = upload;
/* =====================================================
   TWO TYPES OF MULTER
===================================================== */

// For image uploads (avatar, inventory, bike)
const uploadFields = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// For normal multipart form-data WITHOUT files (React Native forms)
const uploadForm = multer(); // memory parser only for text fields

module.exports = {
  uploadFields,
  uploadForm,
};