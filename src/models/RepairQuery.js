const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: {
    type: String,
    enum: ["customer", "owner"],
    required: true,
  },
  text: String,
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const repairQuerySchema = new mongoose.Schema(
  {
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    service: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Service",
    },

    status: {
      type: String,
      enum: ["open", "answered", "closed"],
      default: "open",
    },

    messages: [messageSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("RepairQuery", repairQuerySchema);