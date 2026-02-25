const fs = require("fs");
const path = require("path");
const Inventory = require("../models/InventoryItem");

const UPLOAD_DIR = path.join(__dirname, "..", "uploads");
const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000"; // set in env


exports.addItem = async (req, res) => {
  try {
    // ---------- IMAGE HANDLING ----------
    let imageUrl = null;

    // If image uploaded via multer
    if (req.file) {
      imageUrl = `${SERVER_URL}/uploads/parts/${req.file.filename}`;
    }
    // If image passed as string (fallback)
    else if (req.body.image) {
      imageUrl = req.body.image;
    }

    // ---------- PAYLOAD ----------
    const payload = {
      name: req.body.name,
      category: req.body.category,
      bikeModel: req.body.bikeModel,

      owner: req.user._id,
      image: imageUrl,

      quantity: Number(req.body.quantity || 0),
      reservedQty: Number(req.body.reservedQty || 0),
      minThreshold: Number(req.body.minThreshold || 2),
      price: Number(req.body.price || 0),
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

    // numeric normalization
    if (updates.quantity !== undefined) updates.quantity = Number(updates.quantity);
    if (updates.reservedQty !== undefined) updates.reservedQty = Number(updates.reservedQty);
    if (updates.minThreshold !== undefined) updates.minThreshold = Number(updates.minThreshold);

    // if (req.file?.filename) {
    //   // remove previous file from disk (if it exists and is stored in uploads)
    //   try {
    //     const prev = item.image;
    //     if (prev && prev.includes("/uploads/")) {
    //       const filename = prev.split("/uploads/").pop();
    //       const fp = path.join(UPLOAD_DIR, filename);
    //       if (fs.existsSync(fp)) fs.unlinkSync(fp);
    //     }
    //   } catch (e) {
    //     console.warn("Failed removing old image:", e.message);
    //   }
    //   updates.image = `${SERVER_URL}/uploads/${req.file.filename}`;
    // }
// ---------- when handling req.file in addItem / updateItem ----------
// (in addItem you already used)
// imageUrl = `${SERVER_URL}/uploads/parts/${req.file.filename}`

// in updateItem: when a new file is uploaded, use the same pattern and
// remove previous file robustly:

if (req.file?.filename) {
  // remove previous file from disk (if it exists and is stored in uploads)
  try {
    const prev = item.image;
    if (prev && prev.includes("/uploads/")) {
      // Get everything after '/uploads/' => could be 'parts/filename.jpg' or 'filename.jpg'
      const rel = prev.split("/uploads/").pop();
      const fp = path.join(UPLOAD_DIR, rel);
      if (fs.existsSync(fp)) fs.unlinkSync(fp);
    }
  } catch (e) {
    console.warn("Failed removing old image:", e.message);
  }
  // save new file path in same uploads/parts subfolder
  updates.image = `${SERVER_URL}/uploads/parts/${req.file.filename}`;
}
    const updated = await Inventory.findByIdAndUpdate(req.params.id, updates, { new: true });
    res.json(updated);
  } catch (err) {
    console.error("updateItem error:", err);
    res.status(500).json({ message: err.message });
  }
};

/** Delete item */

/** Delete item */
exports.deleteItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Forbidden" });
    if (item.reservedQty > 0) return res.status(400).json({ message: "Cannot delete item. It is reserved in an active booking" });

    // remove file if it's in uploads
    try {
      const prev = item.image;
      if (prev && prev.includes("/uploads/")) {
        const filename = prev.split("/uploads/").pop();
        const fp = path.join(UPLOAD_DIR, filename);
        if (fs.existsSync(fp)) fs.unlinkSync(fp);
      }
    } catch (e) {
      console.warn("Failed removing file during delete:", e.message);
    }

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