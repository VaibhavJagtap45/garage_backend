const fs = require("fs");
const path = require("path");
const Inventory = require("../models/InventoryItem");
const Mechanic = require("../models/Mechanic");

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
const SERVER_URL = process.env.SERVER_URL || "http://localhost:5000";

/* ======================================================
   ADD INVENTORY ITEM (OWNER)
====================================================== */
exports.addItem = async (req, res) => {
  try {
    // RN FormData fix
    if (req.body && req.body._parts) {
      const parsed = {};
      req.body._parts.forEach(([k, v]) => {
        if (typeof v === "string") parsed[k] = v.trim();
      });
      req.body = parsed;
    }

    let imageUrl = null;
    if (req.file) {
      imageUrl = `${SERVER_URL}/uploads/parts/${req.file.filename}`;
    }

    const item = await Inventory.create({
      owner: req.user._id,
      partName: req.body.partName,
      bikeName: req.body.bikeName,
      category: req.body.category || "General",
      quantity: Number(req.body.quantity || 0),
      minThreshold: Number(req.body.minThreshold || 2),
      price: Number(req.body.price || 0),
      image: imageUrl,
    });

    res.status(201).json(item);
  } catch (err) {
    console.error("addItem:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   GET OWNER INVENTORY
====================================================== */
exports.getItems = async (req, res) => {
  try {
    const q = { owner: req.user._id };
    if (req.query.search) {
      q.partName = { $regex: req.query.search, $options: "i" };
    }
    const items = await Inventory.find(q).sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) {
    console.error("getItems:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   GET SINGLE ITEM (public)
====================================================== */
exports.getItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    res.json(item);
  } catch (err) {
    console.error("getItem:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   UPDATE ITEM (OWNER)
====================================================== */
exports.updateItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });

    if (req.file?.filename) {
      try {
        if (item.image?.includes("/uploads/")) {
          const rel = item.image.split("/uploads/").pop();
          fs.unlinkSync(path.join(UPLOAD_DIR, rel));
        }
      } catch {}
      item.image = `${SERVER_URL}/uploads/parts/${req.file.filename}`;
    }

    if (req.body.partName !== undefined) item.partName = req.body.partName;
    if (req.body.bikeName !== undefined) item.bikeName = req.body.bikeName;
    if (req.body.category !== undefined) item.category = req.body.category;
    if (req.body.quantity !== undefined) item.quantity = Number(req.body.quantity);
    if (req.body.minThreshold !== undefined) item.minThreshold = Number(req.body.minThreshold);
    if (req.body.price !== undefined) item.price = Number(req.body.price);

    await item.save();
    res.json(item);
  } catch (err) {
    console.error("updateItem:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   DELETE ITEM
====================================================== */
exports.deleteItem = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });
    if (item.reservedQty > 0)
      return res.status(400).json({ message: "Item is reserved" });

    try {
      if (item.image?.includes("/uploads/")) {
        const rel = item.image.split("/uploads/").pop();
        fs.unlinkSync(path.join(UPLOAD_DIR, rel));
      }
    } catch {}

    await item.deleteOne();
    res.json({ message: "Item deleted" });
  } catch (err) {
    console.error("deleteItem:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   RESTOCK ITEM
====================================================== */
exports.restock = async (req, res) => {
  try {
    const qty = Number(req.body.qty);
    if (!qty || qty <= 0) return res.status(400).json({ message: "Invalid qty" });

    const item = await Inventory.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Item not found" });
    if (item.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Forbidden" });

    item.quantity += qty;
    await item.save();
    res.json(item);
  } catch (err) {
    console.error("restock:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   RESERVE PART (OWNER)
====================================================== */
exports.reserveForBooking = async (req, res) => {
  try {
    const { itemId, qty } = req.body;
    const item = await Inventory.findOneAndUpdate(
      {
        _id: itemId,
        owner: req.user._id,
        $expr: { $gte: [{ $subtract: ["$quantity", "$reservedQty"] }, qty] },
      },
      { $inc: { reservedQty: qty } },
      { new: true }
    );

    if (!item) return res.status(400).json({ message: "Insufficient stock" });

    res.json(item);
  } catch (err) {
    console.error("reserve:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   UNRESERVE PART (OWNER)
====================================================== */
exports.unreserve = async (req, res) => {
  try {
    const { itemId, qty } = req.body;
    const item = await Inventory.findById(itemId);
    if (!item) return res.status(404).json({ message: "Item not found" });

    // ✅ ensure item belongs to owner
    if (item.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your item" });

    item.reservedQty = Math.max(0, item.reservedQty - Number(qty || 0));
    await item.save();

    res.json(item);
  } catch (err) {
    console.error("unreserve:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   LOW STOCK ALERT
====================================================== */
exports.lowStock = async (req, res) => {
  try {
    const items = await Inventory.find({
      owner: req.user._id,
      $expr: {
        $lte: [{ $subtract: ["$quantity", "$reservedQty"] }, "$minThreshold"],
      },
    });
    res.json(items);
  } catch (err) {
    console.error("lowStock:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ======================================================
   MECHANIC → VIEW GARAGE INVENTORY
====================================================== */
exports.getGarageInventoryForMechanic = async (req, res) => {
  try {
    const mechanic = await Mechanic.findOne({ user: req.user._id });
    if (!mechanic) return res.status(404).json({ message: "Mechanic not linked" });

    const items = await Inventory.find({ owner: mechanic.owner })
      .select("partName bikeName category quantity reservedQty price image minThreshold")
      .sort({ createdAt: -1 });

    res.json(items);
  } catch (err) {
    console.error("getGarageInventoryForMechanic:", err);
    res.status(500).json({ message: err.message });
  }
};