const mongoose = require("mongoose");

const mechanicSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // linked login account
    name: String,
    phone: String,
    skills: [String],
    experienceYears: Number,
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ✅ UNIQUE SPARSE INDEX to prevent one user being linked to multiple mechanic profiles
mechanicSchema.index({ user: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("Mechanic", mechanicSchema);