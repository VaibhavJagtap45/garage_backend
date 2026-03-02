const mongoose = require("mongoose");

const mechanicRequestSchema = new mongoose.Schema(
  {
    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    message: {type: String}, // optional message from mechanic
    respondedAt: Date,
  },
  { timestamps: true }
);

// Ensure a mechanic can only request once per owner
// Only one pending per mechanic-owner pair
mechanicRequestSchema.index(
  { mechanic: 1, owner: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

module.exports = mongoose.model("MechanicRequest", mechanicRequestSchema);