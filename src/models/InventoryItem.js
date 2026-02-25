const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    name: String,
    category: String,
    bikeModel: String,

    quantity: { type: Number, default: 0 },
    reservedQty: { type: Number, default: 0 },

    minThreshold: { type: Number, default: 2 },
    price: Number,

    image: String,
  },
  { timestamps: true }
);

// available stock virtual
inventorySchema.virtual("availableQty").get(function () {
  return this.quantity - this.reservedQty;
});

// inventorySchema.pre("save", function(next) {
//   if (this.quantity < 0) this.quantity = 0;
//   if (this.reservedQty < 0) this.reservedQty = 0;
//   next();
// });
inventorySchema.pre("save", function () {
  if (this.quantity < 0) this.quantity = 0;
  if (this.reservedQty < 0) this.reservedQty = 0;
});
module.exports = mongoose.model("InventoryItem", inventorySchema);