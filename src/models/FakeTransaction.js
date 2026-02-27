const mongoose = require("mongoose");

const FakeTransactionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
    },

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    amount: {
      type: Number,
      required: true,
    },

    transactionId: {
      type: String,
      required: true,
    },

    method: {
      type: String,
      enum: ["UPI", "CARD", "WALLET"],
      default: "UPI",
    },

    status: {
      type: String,
      enum: ["success"],
      default: "success",
    },
  },
  { timestamps: true }
);

// Index for owner transaction listing
FakeTransactionSchema.index({ owner: 1, createdAt: -1 });

module.exports = mongoose.model("FakeTransaction", FakeTransactionSchema);