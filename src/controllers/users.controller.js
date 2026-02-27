const User = require("../models/User");
const Mechanic = require("../models/Mechanic");
const fs = require("fs");
const path = require("path");

/* Helper to get local file path from avatar URL */
function getLocalFilePathFromAvatar(avatar) {
  if (!avatar) return null;
  try {
    if (avatar.startsWith("http://") || avatar.startsWith("https://")) {
      const u = new URL(avatar);
      avatar = u.pathname;
    }
  } catch (e) {}
  if (avatar.startsWith("/")) avatar = avatar.slice(1);
  if (!avatar.startsWith("uploads/")) return null;
  return path.join(__dirname, "..", "..", avatar);
}

/* =========================================================
   GET PROFILE
========================================================= */
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("GET PROFILE ERROR:", err);
    res.status(500).json({ message: "Failed to fetch profile" });
  }
};

/* =========================================================
   GET MECHANICS (OWNER ONLY)
========================================================= */
exports.getMechanics = async (req, res) => {
  try {
    const mechanics = await Mechanic.find({ owner: req.user._id })
      .populate("user", "name phone email avatar");
    res.json(mechanics);
  } catch (err) {
    console.error("GET MECHANICS ERROR:", err);
    res.status(500).json({ message: "Failed to fetch mechanics" });
  }
};

/* =========================================================
   UPDATE PROFILE
========================================================= */
exports.updateProfile = async (req, res) => {
  try {
    console.log("UPDATE PROFILE CONTROLLER HIT");

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

    // ✅ Ensure req.body is a plain object before using it
    const body = (req.body && typeof req.body === "object" && !Array.isArray(req.body)) ? req.body : {};

    // Copy allowed fields safely
    for (const key of Object.keys(body)) {
      if (allowedFields.includes(key)) {
        updates[key] = body[key];
      }
    }

    // Avatar handling – check for empty string explicitly (no hasOwnProperty needed)
    if (body.avatar === "") {
      const oldPath = getLocalFilePathFromAvatar(req.user.avatar);
      if (oldPath && fs.existsSync(oldPath)) {
        try { fs.unlinkSync(oldPath); } catch {}
      }
      updates.avatar = null;
    }

    // If a new file was uploaded, it takes precedence
    if (req.file) {
      if (req.user.avatar) {
        const oldPath = getLocalFilePathFromAvatar(req.user.avatar);
        if (oldPath && fs.existsSync(oldPath)) {
          try { fs.unlinkSync(oldPath); } catch {}
        }
      }
      updates.avatar = `/uploads/avatars/${req.file.filename}`;
    }

    // Address normalization
    const normalizeAddress = (addr) => {
      if (!addr) return addr;
      if (typeof addr === "string") {
        try { addr = JSON.parse(addr); } catch { return addr; }
      }
      if (addr?.location?.lat && addr?.location?.lng) {
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

    if (updates.garageAddress) updates.garageAddress = normalizeAddress(updates.garageAddress);
    if (updates.address) updates.address = normalizeAddress(updates.address);

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    res.json(user);
  } catch (err) {
    console.error("UPDATE PROFILE ERROR:", err);
    res.status(500).json({ message: "Server error" });
  }
};