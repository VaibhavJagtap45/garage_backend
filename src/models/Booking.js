const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: "Mechanic", default: null },

    scheduledDate: { type: Date, required: true },

    // ✅ ADDED missing address field (used in createBooking)
    address: { type: String }, // doorstep address

    status: {
      type: String,
      enum: [
        "pending",      // customer created
        "accepted",     // owner accepted
        "rejected",     // owner rejected
        "assigned",     // mechanic assigned
        "in_progress",  // mechanic started job
        "completed",    // work finished
        "cancelled"     // customer cancelled
      ],
      default: "pending",
    },

    // Price fields
    totalPrice: Number,
    discount: { type: Number, default: 0 },
    finalPrice: Number,
    coupon: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon", default: null },

    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },
    paidAt: Date,
    notes: String,

    // Parts reserved at assignment
    parts: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem" },
        qty: Number,
      },
    ],

    // Parts actually used after repair
    partsUsed: [
      {
        item: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem" },
        partName: String,
        qty: Number,
      },
    ],

    assignedAt: Date,
    startedAt: Date,
    completedAt: Date,

    rescheduledCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Indexes for performance
bookingSchema.index({ mechanic: 1, scheduledDate: 1 });
bookingSchema.index({ customer: 1 }); // for myBookings
bookingSchema.index({ service: 1 });   // for ownerBookings

module.exports = mongoose.model("Booking", bookingSchema);