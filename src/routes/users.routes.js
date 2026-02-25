// // users.routes.js
// const router = require("express").Router();
// const auth = require("../middlewares/auth.middleware");
// const User = require("../models/User");
// const upload = require("../middlewares/upload.middleware");
// const fs = require("fs");
// const path = require("path");
// const role = require("../middlewares/role.middleware");
// // GET PROFILE
// router.get("/me", auth, async (req, res) => {
//   res.json(req.user);
// });


// /* GET ALL MECHANICS (OWNER ONLY) */
// router.get("/mechanics", auth, role("owner"), async (req, res) => {
//   try {
//     const mechanics = await User.find({ role: "mechanic" })
//       .select("name phone email");

//     res.json(mechanics);
//   } catch (err) {
//     res.status(500).json({ message: err.message, success: false });
//   }
// });

// router.put("/me", auth, upload.single("avatar"), async (req, res) => {
//   try {
//     const allowedCustomer = ["name", "phone", "address"];
//     const allowedOwner = [
//       ...allowedCustomer,
//       "garageName",
//       "garageAddress",
//       "openingHours",
//       "offersDoorstep",
//       "serviceAreaKm",
//     ];

//     const allowedFields =
//       req.user.role === "owner" ? allowedOwner : allowedCustomer;

//     const updates = {};
//     const body = req.body || {};

//     /* copy allowed fields */
//     for (const key of Object.keys(body)) {
//       if (allowedFields.includes(key)) updates[key] = body[key];
//     }

//     /* ========= HANDLE AVATAR ========= */
//     if (req.file) {

//       // delete old avatar
//       if (req.user.avatar) {
//         const oldPath = path.join(
//           __dirname,
//           "..",
//           req.user.avatar.replace("/uploads/", "uploads/")
//         );

//         if (fs.existsSync(oldPath)) {
//           fs.unlinkSync(oldPath);
//         }
//       }

//       // correct path
//       updates.avatar = `/uploads/${req.file.filename}`;
//     }

//     const user = await User.findByIdAndUpdate(
//       req.user._id,
//       updates,
//       { returnDocument: "after" }
//     ).select("-password");

//     res.json(user);

//   } catch (err) {
//     console.error("update profile error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// });

// module.exports = router;





// src/routes/users.routes.js
const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
// const upload = require("../middlewares/upload.middleware");
const { uploadFields } = require("../middlewares/upload.middleware");
const User = require("../models/User");
const fs = require("fs");
const path = require("path");
const role = require("../middlewares/role.middleware");

// helper: map stored avatar (relative or absolute) -> filesystem path
function getLocalFilePathFromAvatar(avatar) {
  if (!avatar) return null;

  // If it's a full URL (http(s)://...), extract pathname
  try {
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      const u = new URL(avatar);
      avatar = u.pathname; // e.g. /uploads/avatars/xxx.jpg
    }
  } catch (e) {
    // ignore
  }

  // if avatar now looks like "/uploads/..." or "uploads/..."
  if (!avatar) return null;
  const rel = avatar.startsWith("/uploads/") ? avatar.replace("/uploads/", "uploads/") :
              avatar.startsWith("uploads/") ? avatar :
              null;

  if (!rel) return null;

  // project root: path.join(__dirname, "..", rel)
  return path.join(__dirname, "..", rel);
}

/* ========== GET PROFILE ========== */
// router.get("/me", auth, async (req, res) => {
//   res.json(req.user);
// });

router.get("/me", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user)
      return res.status(404).json({ message: "User not found" });

    res.json(user);
  } catch (err) {
    console.error("GET ME ERROR:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
});
/* ========== GET ALL MECHANICS (OWNER ONLY) ========== */
router.get("/mechanics", auth, role("owner"), async (req, res) => {
  try {
    const mechanics = await User.find({ role: "mechanic" }).select("name phone email");
    res.json(mechanics);
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
});

/* ========== UPDATE PROFILE ========== */
/**
 * Notes:
 * - Accepts multipart/form-data (avatar file under field "avatar")
 * - If frontend sends avatar === "" (empty string), we treat that as "remove avatar"
 */
router.put("/me", auth, uploadFields.single("avatar"), async (req, res) => {
  try {
    const allowedCustomer = ["name", "phone", "address"];
    const allowedOwner = [
      ...allowedCustomer,
      "garageName",
      "garageAddress",
      "openingHours",
      "offersDoorstep",
      "serviceAreaKm",
    ];
    const allowedFields = req.user.role === "owner" ? allowedOwner : allowedCustomer;

    const updates = {};
    const body = req.body || {};

    // copy allowed fields from body (text fields)
    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) {
        updates[key] = body[key];
      }
    }

    // ---------- handle explicit avatar removal (frontend sent avatar: "") ----------
    // The frontend may send a text field 'avatar' === "" to signal deletion.
    const sentAvatarField = Object.prototype.hasOwnProperty.call(body, "avatar");

    if (sentAvatarField && body.avatar === "") {
      // delete old avatar file (if exists)
      const oldPath = getLocalFilePathFromAvatar(req.user.avatar);
      if (oldPath && fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch (e) { console.warn("failed to delete old avatar:", e); }
      }
      // clear in DB
      updates.avatar = null;
    }

    // ---------- handle new uploaded file ----------
    if (req.file) {
      // delete old avatar if present
      if (req.user.avatar) {
        const oldPath = getLocalFilePathFromAvatar(req.user.avatar);
        if (oldPath && fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch (e) { console.warn("failed to delete old avatar:", e); }
        }
      }

      // store relative path so frontend can prefix server base URL
      // NOTE: multer's filename created as 'avatar_<user>_<ts>.ext' and stored in uploads/avatars
      // updates.avatar = `/uploads/avatars/${req.file.filename}`;
     updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // ---------- normalize JSON address fields if any ----------
    const normalizeAddress = (addr) => {
      if (!addr) return addr;
      if (typeof addr === "string") {
        try { addr = JSON.parse(addr); } catch (_) { return addr; }
      }
      if (addr?.location && addr.location.lat && addr.location.lng) {
        addr.location = {
          type: "Point",
          coordinates: [ parseFloat(addr.location.lng), parseFloat(addr.location.lat) ],
        };
      }
      return addr;
    };

    if (updates.garageAddress) updates.garageAddress = normalizeAddress(updates.garageAddress);
    if (updates.address) updates.address = normalizeAddress(updates.address);

    // ---------- perform update ----------
    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router; 