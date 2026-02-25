const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: "Mechanic", default: null },

    scheduledDate: { type: Date, required: true },

    // status: {
    //   type: String,
    //   enum: ["pending","assigned","in_progress","completed","cancelled"],
    //   default: "pending",
    // },
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
    /* ---------- PRICE ---------- */
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
    /* ---------- PARTS ---------- */
    parts: [
      {
        itemId: { type: mongoose.Schema.Types.ObjectId, ref: "InventoryItem" },
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

bookingSchema.index({ mechanic: 1, scheduledDate: 1 });

module.exports = mongoose.model("Booking", bookingSchema);