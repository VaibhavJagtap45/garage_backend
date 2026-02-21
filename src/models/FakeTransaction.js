// const mongoose = require("mongoose");

// const fakeTransactionSchema = new mongoose.Schema(
//   {
//     booking: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "Booking",
//     },

//     user: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },

// amount: { type: Number, required: true },
// transactionId: { type: String, required: true, unique: true },

//     method: {
//       type: String,
//       enum: ["UPI", "CARD", "WALLET"],
//       default: "UPI",
//     },

//     status: {
//       type: String,
//       enum: ["success"],
//       default: "success",
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("FakeTransaction", fakeTransactionSchema);

















const mongoose = require("mongoose");

const fakeTransactionSchema = new mongoose.Schema(
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

    // ⭐ ADD THIS
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

module.exports = mongoose.model("FakeTransaction", fakeTransactionSchema);