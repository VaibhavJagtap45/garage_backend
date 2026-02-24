// // upload.middleware.js
// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// // ensure upload folder exists
// const uploadPath = path.join(__dirname, "..", "uploads");
// if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });

// const storage = multer.diskStorage({
//   destination: (req, file, cb) => {
//     cb(null, uploadPath);
//   },
//   filename: (req, file, cb) => {
//     const unique = Date.now() + path.extname(file.originalname);
//     cb(null, unique);
//   },
// });

// const upload = multer({
//   storage,
//   limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
// });

// module.exports = upload;





const multer = require("multer");
const path = require("path");
const fs = require("fs");

/* ================== CREATE AVATAR FOLDER ================== */

const avatarPath = path.join(__dirname, "..", "uploads", "avatars");

if (!fs.existsSync(avatarPath)) {
  fs.mkdirSync(avatarPath, { recursive: true });
}

/* ================== STORAGE ================== */

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarPath);
  },

  filename: (req, file, cb) => {
    // safer filename
    const ext = path.extname(file.originalname || ".jpg");

    const uniqueName =
      "avatar_" + req.user._id + "_" + Date.now() + ext;

    cb(null, uniqueName);
  },
});

/* ================== FILE FILTER ================== */

const fileFilter = (req, file, cb) => {
  // allow only images
  if (!file.mimetype.startsWith("image/")) {
    return cb(new Error("Only image files allowed"), false);
  }
  cb(null, true);
};

/* ================== EXPORT ================== */

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

module.exports = upload;