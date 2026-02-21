// const mongoose = require("mongoose");

// const bookingSchema = new mongoose.Schema(
//   {
//     customer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
//     service: { type: mongoose.Schema.Types.ObjectId, ref: "Service" },
//     mechanic: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

//     scheduledDate: Date,

//   status: {
//   type: String,
//   enum: [
//     "pending",          // customer created
//     "assigned",         // owner assigned mechanic
//     "accepted",         // mechanic accepted
//     "in_progress",      // mechanic started
//     "completed",        // finished
//     "cancelled"
//   ],
//   default: "pending",
// },
//     rescheduledCount: {
//   type: Number,
//   default: 0,
// },

//     totalPrice: Number,
//     notes: String,
//   },
// //   assignedAt: Date,
// // startedAt: Date,
// // completedAt: Date,
//   { timestamps: true }
// );

// module.exports = mongoose.model("Booking", bookingSchema);













const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    service: { type: mongoose.Schema.Types.ObjectId, ref: "Service", required: true },
    mechanic: { type: mongoose.Schema.Types.ObjectId, ref: "Mechanic", default: null },

    scheduledDate: { type: Date, required: true },

    status: {
      type: String,
      enum: ["pending","assigned","in_progress","completed","cancelled"],
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