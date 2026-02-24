// const router = require("express").Router();
// const auth = require("../middlewares/auth.middleware");
// const User = require("../models/User");

// // GET PROFILE
// router.get("/me", auth, async (req, res) => {
//   res.json(req.user);
// });

// // UPDATE PROFILE
// router.put("/me", auth, async (req, res) => {
//   const user = await User.findByIdAndUpdate(req.user._id, req.body, {
//     new: true,
//   });

//   res.json(user);
// });

// module.exports = router;




// users.routes.js
const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const User = require("../models/User");
const upload = require("../middlewares/upload.middleware");
const fs = require("fs");
const path = require("path");
const role = require("../middlewares/role.middleware");
// GET PROFILE
router.get("/me", auth, async (req, res) => {
  res.json(req.user);
});

/**
 * UPDATE PROFILE - only allowed fields
 */
// router.put("/me", auth, async (req, res) => {
//   try {
//     const allowedCustomer = ["name", "phone", "avatar", "address"];
//     const allowedOwner = [
//       ...allowedCustomer,
//       "garageName",
//       "garageAddress",
//       "openingHours",
//       "offersDoorstep",
//       "serviceAreaKm",
//     ];

//     const allowedFields = req.user.role === "owner" ? allowedOwner : allowedCustomer;

//     const updates = {};
//     for (const key of Object.keys(req.body)) {
//       if (allowedFields.includes(key)) updates[key] = req.body[key];
//     }

//     // normalize address -> GeoJSON if provided with lat/lng
//     const normalizeAddress = (addr) => {
//       if (!addr) return addr;
//       if (addr.location && addr.location.lat && addr.location.lng) {
//         addr.location = {
//           type: "Point",
//           coordinates: [parseFloat(addr.location.lng), parseFloat(addr.location.lat)],
//         };
//       } else if (Array.isArray(addr.location) && addr.location.length === 2) {
//         addr.location = { type: "Point", coordinates: [addr.location[0], addr.location[1]] };
//       }
//       return addr;
//     };

//     if (updates.garageAddress) updates.garageAddress = normalizeAddress(updates.garageAddress);
//     if (updates.address) updates.address = normalizeAddress(updates.address);

//     const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
//     res.json(user);
//   } catch (err) {
//     console.error("update profile error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
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
//       // delete old avatar if exists
//   if (req.user.avatar) {
//   const oldPath = path.join(
//     __dirname,
//     "..",
//     req.user.avatar.replace("/uploads/", "uploads/")
//   );

//   if (fs.existsSync(oldPath)) {
//     fs.unlinkSync(oldPath);
//   }
// }

//       // updates.avatar = `/uploads/avatars/${req.file.filename}`;
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

/* GET ALL MECHANICS (OWNER ONLY) */
router.get("/mechanics", auth, role("owner"), async (req, res) => {
  try {
    const mechanics = await User.find({ role: "mechanic" })
      .select("name phone email");

    res.json(mechanics);
  } catch (err) {
    res.status(500).json({ message: err.message, success: false });
  }
});

router.put("/me", auth, upload.single("avatar"), async (req, res) => {
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

    const allowedFields =
      req.user.role === "owner" ? allowedOwner : allowedCustomer;

    const updates = {};
    const body = req.body || {};

    /* copy allowed fields */
    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) updates[key] = body[key];
    }

    /* ========= HANDLE AVATAR ========= */
    if (req.file) {

      // delete old avatar
      if (req.user.avatar) {
        const oldPath = path.join(
          __dirname,
          "..",
          req.user.avatar.replace("/uploads/", "uploads/")
        );

        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }

      // correct path
      updates.avatar = `/uploads/${req.file.filename}`;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { returnDocument: "after" }
    ).select("-password");

    res.json(user);

  } catch (err) {
    console.error("update profile error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;