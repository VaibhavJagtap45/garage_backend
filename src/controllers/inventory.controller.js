// // src/controllers/inventory.controller.js
// const Inventory = require("../models/InventoryItem");

// /** Create item (owner only) */
// exports.addItem = async (req, res) => {
//   try {
//     const payload = {
//       ...req.body,
//       owner: req.user.id,
//       image: req.file?.filename || req.body.image,
//     };
//     const item = await Inventory.create(payload);
//     res.json(item);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// /** Get paginated items for owner */
// exports.getItems = async (req, res) => {
//   try {
//     const page = parseInt(req.query.page) || 1;
//     const limit = Math.min(parseInt(req.query.limit) || 20, 100);
//     const q = { owner: req.user.id };

//     // optional filters
//     if (req.query.category) q.category = req.query.category;
//     if (req.query.bikeModel) q.bikeModel = req.query.bikeModel;
//     if (req.query.search) q.name = { $regex: req.query.search, $options: "i" };

//     const items = await Inventory.find(q)
//       .skip((page - 1) * limit)
//       .limit(limit)
//       .sort({ createdAt: -1 });

//     const total = await Inventory.countDocuments(q);

//     res.json({ items, page, limit, total });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// /** Get single item (public) */
// exports.getItem = async (req, res) => {
//   try {
//     const item = await Inventory.findById(req.params.id).populate("owner", "name phone");
//     if (!item) return res.status(404).json({ message: "Not found" });
//     res.json(item);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// /** Update item (owner only) */
// exports.updateItem = async (req, res) => {
//   try {
//     const item = await Inventory.findById(req.params.id);
//     if (!item) return res.status(404).json({ message: "Not found" });
//     if (item.owner.toString() !== req.user.id) return res.status(403).json({ message: "Forbidden" });

//     // allow updating fields
//     const updates = { ...req.body };
//     if (req.file?.filename) updates.image = req.file.filename;

//     const updated = await Inventory.findByIdAndUpdate(req.params.id, updates, { new: true });
//     res.json(updated);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// /** Delete item */
// exports.deleteItem = async (req, res) => {
//   try {
//     const item = await Inventory.findById(req.params.id);
//     if (!item) return res.status(404).json({ message: "Not found" });
//     if (item.owner.toString() !== req.user.id) return res.status(403).json({ message: "Forbidden" });

//     await item.remove();
//     res.json({ message: "Deleted" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// /** Restock (increase quantity) */
// exports.restock = async (req, res) => {
//   try {
//     const { qty } = req.body; // positive integer
//     if (!Number.isInteger(qty) || qty <= 0) return res.status(400).json({ message: "Invalid qty" });

//     const item = await Inventory.findById(req.params.id);
//     if (!item) return res.status(404).json({ message: "Not found" });
//     if (item.owner.toString() !== req.user.id) return res.status(403).json({ message: "Forbidden" });

//     item.quantity += qty;
//     await item.save();

//     res.json(item);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// /** Reserve items for booking (called when owner accepts/assigns booking or when booking confirmed) */
// exports.reserveForBooking = async (req, res) => {
//   try {
//     const { itemId, qty } = req.body;
//     if (!itemId || !qty || qty <= 0) return res.status(400).json({ message: "Invalid payload" });

//     const item = await Inventory.findById(itemId);
//     if (!item) return res.status(404).json({ message: "Item not found" });

//     if (item.owner.toString() !== req.user.id) return res.status(403).json({ message: "Forbidden" });

//     // available = quantity - reservedQty
//     const available = item.quantity - item.reservedQty;
//     if (available < qty) return res.status(400).json({ message: "Not enough stock", available });

//     item.reservedQty += qty;
//     await item.save();

//     res.json({ message: "Reserved", item });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// /** Unreserve items (booking cancelled) */
// exports.unreserve = async (req, res) => {
//   try {
//     const { itemId, qty } = req.body;
//     const item = await Inventory.findById(itemId);
//     if (!item) return res.status(404).json({ message: "Item not found" });
//     if (item.owner.toString() !== req.user.id) return res.status(403).json({ message: "Forbidden" });

//     item.reservedQty = Math.max(0, item.reservedQty - (qty || 0));
//     await item.save();
//     res.json({ message: "Unreserved", item });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// /** Low stock list (owner) */
// exports.lowStock = async (req, res) => {
//   try {
//     const items = await Inventory.find({
//       owner: req.user.id,
//       $expr: { $lte: [{ $subtract: ["$quantity", "$reservedQty"] }, "$minThreshold"] },
//     });
//     res.json(items);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


















// inventory.controller.js
const Inventory = require("../models/InventoryItem");

/** Create item (owner only) */
exports.addItem = async (req, res) => {
  try {
    const payload = {
      ...req.body,
      owner: req.user._id,
      image: req.file?.filename || req.body.image,
    };
    const item = await Inventory.create(payload);
    res.status(201).json(item);
  } catch (err) {
    console.error("addItem error:", err);
    res.status(500).json({ message: err.message });
  }
};

/** Get paginated items for owner */
exports.getItems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const q = { owner: req.user._id };

    if (req.query.category) q.category = req.query.category;
    if (req.query.bikeModel) q.bikeModel = req.query.bikeModel;
    if (req.query.search) q.name = { $regex: req.query.search, $options: "i" };

    const items = await Inventory.find(q)
      .skip((page - 1) * limit)
      .limit(limit)
      .sort({ createdAt: -1 });

    const total = await Inventory.countDocuments(q);

    res.json({ items, page, limit, total });
  } catch (err) {
    console.error("getItems error:", err);
    res.status(500).json({ message: err.message });
  }
};

/** Get single item (public) */
exports.getItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id).populate("owner", "name phone");
    if (!item) return res.status(404).json({ message: "Not found" });
    res.json(item);
  } catch (err) {
    console.error("getItem error:", err);
    res.status(500).json({ message: err.message });
  }
};

/** Update item (owner only) */
exports.updateItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    if (item.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Forbidden" });

    const updates = { ...req.body };
    if (req.file?.filename) updates.image = req.file.filename;

    const updated = await Inventory.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("updateItem error:", err);
    res.status(500).json({ message: err.message });
  }
};

/** Delete item */
// exports.deleteItem = async (req, res) => {
//   try {
//     const item = await Inventory.findById(req.params.id);
//     if (!item) return res.status(404).json({ message: "Not found" });
//     if (item.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Forbidden" });

//     await item.remove();
//     res.json({ message: "Deleted" });
//   } catch (err) {
//     console.error("deleteItem error:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

/** Delete item */
exports.deleteItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);

    if (!item)
      return res.status(404).json({ message: "Item not found" });

    // owner permission check
    if (item.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });

    // IMPORTANT: do not delete if reserved in booking
    if (item.reservedQty > 0)
      return res.status(400).json({
        message: "Cannot delete item. It is reserved in an active booking",
      });

    await item.deleteOne();

    res.json({ message: "Item deleted successfully" });
  } catch (err) {
    console.error("deleteItem error:", err);
    res.status(500).json({ message: err.message });
  }
};
/** Restock (increase quantity) */
exports.restock = async (req, res) => {
  try {
    const { qty } = req.body;
    if (!Number.isInteger(qty) || qty <= 0) return res.status(400).json({ message: "Invalid qty" });

    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Not found" });
    if (item.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Forbidden" });

    item.quantity += qty;
    await item.save();

    res.json(item);
  } catch (err) {
    console.error("restock error:", err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * Reserve items for booking (owner) - uses atomic findOneAndUpdate to avoid race condition
 * Body: { itemId, qty }
 */
exports.reserveForBooking = async (req, res) => {
  try {
    const { itemId, qty } = req.body;
    if (!itemId || !qty || qty <= 0) return res.status(400).json({ message: "Invalid payload" });

    // atomic: ensure available >= qty then increment reservedQty
    const item = await Inventory.findOneAndUpdate(
      {
        _id: itemId,
        $expr: { $gte: [{ $subtract: ["$quantity", "$reservedQty"] }, qty] },
        owner: req.user._id,
      },
      { $inc: { reservedQty: qty } },
      { new: true }
    );

    if (!item) {
      // find available amount for better message
      const maybe = await Inventory.findById(itemId);
      const available = maybe ? Math.max(0, maybe.quantity - maybe.reservedQty) : 0;
      return res.status(400).json({ message: "Not enough stock", available });
    }

    res.json({ message: "Reserved", item });
  } catch (err) {
    console.error("reserveForBooking error:", err);
    res.status(500).json({ message: err.message });
  }
};

/** Unreserve (owner) */
exports.unreserve = async (req, res) => {
  try {
    const { itemId, qty } = req.body;
    if (!itemId) return res.status(400).json({ message: "Invalid payload" });

    const dec = Number.isInteger(qty) && qty > 0 ? qty : 0;

    const item = await Inventory.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Forbidden" });

    item.reservedQty = Math.max(0, item.reservedQty - dec);
    await item.save();

    res.json({ message: "Unreserved", item });
  } catch (err) {
    console.error("unreserve error:", err);
    res.status(500).json({ message: err.message });
  }
};

/** Low stock list (owner) */
exports.lowStock = async (req, res) => {
  try {
    const items = await Inventory.find({
      owner: req.user._id,
      $expr: { $lte: [{ $subtract: ["$quantity", "$reservedQty"] }, "$minThreshold"] },
    });
    res.json(items);
  } catch (err) {
    console.error("lowStock error:", err);
    res.status(500).json({ message: err.message });
  }
};