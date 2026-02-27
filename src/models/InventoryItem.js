const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    partName: { type: String, required: true, trim: true },
    bikeName: { type: String, required: true, trim: true },

    category: { type: String, default: "General" },

    quantity: { type: Number, default: 0 },
    reservedQty: { type: Number, default: 0 },

    minThreshold: { type: Number, default: 2 },
    price: { type: Number, default: 0 },

    image: { type: String, default: null },
  },
  { timestamps: true }
);

// Virtual for available quantity
inventorySchema.virtual("availableQty").get(function () {
  return this.quantity - this.reservedQty;
});

// Ensure non-negative values
inventorySchema.pre("save", function () {
  if (this.quantity < 0) this.quantity = 0;
  if (this.reservedQty < 0) this.reservedQty = 0;
  // Optionally ensure reservedQty <= quantity
  if (this.reservedQty > this.quantity) this.reservedQty = this.quantity;
});

// Index for owner queries
inventorySchema.index({ owner: 1, partName: 1 });

module.exports = mongoose.model("InventoryItem", inventorySchema);