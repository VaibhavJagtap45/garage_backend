const mongoose = require("mongoose");

const mechanicSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    phone: String,
    skills: [String],
    experienceYears: Number,
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mechanic", mechanicSchema);