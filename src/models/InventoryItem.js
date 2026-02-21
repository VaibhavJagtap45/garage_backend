// // src/models/InventoryItem.js
// const mongoose = require("mongoose");

// const inventorySchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },          // e.g. "Oil Filter"
//     bikeModel: { type: String },                     // e.g. "Hero Splendor", optional
//     partNumber: { type: String },                    // vendor part id
//     sku: { type: String, unique: true, sparse: true }, // stock keeping unit
//     category: { type: String, default: "part" },     // "part" | "accessory" | "bike"
//     description: String,
//     price: { type: Number, required: true },
//     currency: { type: String, default: "INR" },
//     quantity: { type: Number, default: 0 },          // current stock
//     minThreshold: { type: Number, default: 1 },      // low stock threshold
//     image: String,                                   // filename or S3 url
//     owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
//     // optional: whether this item can be used/consumed by bookings
//     consumable: { type: Boolean, default: true },
//     // reserved quantity for pending/confirmed bookings
//     reservedQty: { type: Number, default: 0 },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("InventoryItem", inventorySchema);














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

inventorySchema.pre("save", function(next) {
  if (this.quantity < 0) this.quantity = 0;
  if (this.reservedQty < 0) this.reservedQty = 0;
  next();
});
module.exports = mongoose.model("InventoryItem", inventorySchema);