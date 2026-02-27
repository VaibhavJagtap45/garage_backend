const mongoose = require("mongoose");

const couponUsageSchema = new mongoose.Schema(
  {
    coupon: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
    },
  },
  { timestamps: true }
);

// ✅ UNIQUE INDEX to prevent duplicate usage by same user on same coupon
couponUsageSchema.index({ coupon: 1, user: 1 }, { unique: true });

module.exports = mongoose.model("CouponUsage", couponUsageSchema);