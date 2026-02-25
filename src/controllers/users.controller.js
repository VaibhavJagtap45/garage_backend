// in src/routes/users.routes.js (or controller file)
const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const User = require("../models/User");

// GET PROFILE (already present)
router.get("/me", auth, async (req, res) => {
  res.json(req.user);
});

/**
 * UPDATE PROFILE
 * - customer: can update name, phone, avatar, address
 * - owner: can update name, phone, avatar, garageName, garageAddress, openingHours, offersDoorstep, serviceAreaKm
 */
router.put("/me", auth, upload.single("avatar"), async (req, res) => {
  try {

    const updates = {};

    /* ================= ALLOWED FIELDS ================= */

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

    // Copy allowed text fields
    for (const key of Object.keys(req.body)) {
      if (allowedFields.includes(key)) {
        updates[key] = req.body[key];
      }
    }

    /* ================= AVATAR IMAGE ================= */

    if (req.file) {
      // create correct URL
      const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";
      updates.avatar = `${SERVER_URL}/uploads/avatars/${req.file.filename}`;
    }

    /* ================= ADDRESS NORMALIZATION ================= */

    const normalizeAddress = (addr) => {
      if (!addr) return addr;

      // If stringified JSON from React Native
      if (typeof addr === "string") {
        try { addr = JSON.parse(addr); }
        catch { return addr; }
      }

      if (addr.location && addr.location.lat && addr.location.lng) {
        addr.location = {
          type: "Point",
          coordinates: [
            parseFloat(addr.location.lng),
            parseFloat(addr.location.lat),
          ],
        };
      }

      return addr;
    };

    if (updates.garageAddress) {
      updates.garageAddress = normalizeAddress(updates.garageAddress);
    }

    if (updates.address) {
      updates.address = normalizeAddress(updates.address);
    }

    /* ================= SAVE ================= */

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