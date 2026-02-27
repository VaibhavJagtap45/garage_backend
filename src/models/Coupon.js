const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    code: {
      type: String,
      required: true,
      uppercase: true,
      unique: true,
    },

    title: String,
    description: String,

    discountType: {
      type: String,
      enum: ["percentage", "flat"],
      required: true,
    },

    discountValue: {
      type: Number,
      required: true,
    },

    minBookingAmount: {
      type: Number,
      default: 0,
    },

    maxDiscount: Number,

    usageLimit: {
      type: Number,
      default: 100,
    },

    usedCount: {
      type: Number,
      default: 0,
    },

    oneTimePerUser: {
      type: Boolean,
      default: true,
    },

    subscribersOnly: {
      type: Boolean,
      default: false,
    },

    type: {
      type: String,
      enum: ["festival", "campaign", "loyalty", "general"],
      default: "general",
    },

    validFrom: { type: Date, required: true },
    validTill: { type: Date, required: true },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Ensure validTill >= validFrom (optional application-level check)
couponSchema.pre("save", function (next) {
  if (this.validTill < this.validFrom) {
    next(new Error("validTill must be after validFrom"));
  } else {
    next();
  }
});

module.exports = mongoose.model("Coupon", couponSchema);