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
router.put("/me", auth, async (req, res) => {
  try {
    const updates = {};
    const allowedCustomer = ["name", "phone", "avatar", "address"];
    const allowedOwner = [
      ...allowedCustomer,
      "garageName",
      "garageAddress",
      "openingHours",
      "offersDoorstep",
      "serviceAreaKm",
    ];

    const allowedFields = req.user.role === "owner" ? allowedOwner : allowedCustomer;

    // copy only allowed fields
    for (const key of Object.keys(req.body)) {
      if (allowedFields.includes(key)) updates[key] = req.body[key];
    }

    // If frontend supplies address as flat object, support both shapes:
    // owner -> garageAddress (structured)
    // customer -> address (structured)
    // Example: { garageAddress: { placeId, formattedAddress, location: { lat, lng } } }

    // Normalize possible lat/lng into GeoJSON coordinates for indexing
    const normalizeAddress = (addr) => {
      if (!addr) return addr;
      if (addr.location && addr.location.lat && addr.location.lng) {
        addr.location = {
          type: "Point",
          coordinates: [parseFloat(addr.location.lng), parseFloat(addr.location.lat)],
        };
      } else if (Array.isArray(addr.location) && addr.location.length === 2) {
        addr.location = { type: "Point", coordinates: [addr.location[0], addr.location[1]] };
      }
      return addr;
    };

    if (updates.garageAddress) updates.garageAddress = normalizeAddress(updates.garageAddress);
    if (updates.address) updates.address = normalizeAddress(updates.address);

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;