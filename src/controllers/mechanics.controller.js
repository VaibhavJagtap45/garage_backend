const Mechanic = require("../models/Mechanic");
const Booking = require("../models/Booking");
const Inventory = require("../models/InventoryItem");
const User = require("../models/User");

/* =====================================================
   ADD MECHANIC (OWNER)
===================================================== */
exports.addMechanic = async (req, res) => {
  try {
    let { name, phone, skills, experienceYears, isAvailable } = req.body;

    if (!name || !phone)
      return res.status(400).json({ message: "Name and phone are required" });

    // Normalize phone
    const normalizedPhone = phone.replace(/\D/g, "");

    // Find registered mechanic user
    const user = await User.findOne({ phone: normalizedPhone, role: "mechanic" });

    if (!user)
      return res.status(400).json({
        message: "Mechanic must register app account first using same phone number",
      });

    // Check if already linked
    const existing = await Mechanic.findOne({ user: user._id });
    if (existing)
      return res.status(400).json({ message: "This mechanic account already linked" });

    if (typeof skills === "string") {
      skills = skills.split(",").map((s) => s.trim()).filter(Boolean);
    }

    const mechanic = await Mechanic.create({
      owner: req.user._id,
      user: user._id,
      name,
      phone: normalizedPhone,
      skills: skills || [],
      experienceYears: Number(experienceYears) || 0,
      isAvailable: true,
    });

    res.status(201).json({ message: "Mechanic linked successfully", mechanic });
  } catch (err) {
    console.error("addMechanic:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   GET MECHANICS (OWNER)
===================================================== */
exports.getMechanics = async (req, res) => {
  try {
    const mechanics = await Mechanic.find({ owner: req.user._id })
      .populate("user", "name phone email avatar")
      .sort({ createdAt: -1 });
    res.json(mechanics);
  } catch (err) {
    console.error("getMechanics:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   UPDATE MECHANIC (OWNER)
===================================================== */
exports.updateMechanic = async (req, res) => {
  try {
    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) return res.status(404).json({ message: "Mechanic not found" });

    if (mechanic.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not allowed" });

    if (req.body.name !== undefined) mechanic.name = req.body.name;
    if (req.body.phone !== undefined) mechanic.phone = req.body.phone.replace(/\D/g, "");
    if (req.body.skills !== undefined) mechanic.skills = req.body.skills;
    if (req.body.experienceYears !== undefined) mechanic.experienceYears = req.body.experienceYears;
    if (req.body.isAvailable !== undefined) mechanic.isAvailable = req.body.isAvailable;

    await mechanic.save();
    res.json({ message: "Mechanic updated", mechanic });
  } catch (err) {
    console.error("updateMechanic:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   DELETE MECHANIC (OWNER)
===================================================== */
exports.deleteMechanic = async (req, res) => {
  try {
    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) return res.status(404).json({ message: "Mechanic not found" });

    if (mechanic.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not allowed" });

    const active = await Booking.findOne({
      mechanic: mechanic._id,
      status: { $in: ["assigned", "in_progress"] },
    });

    if (active)
      return res.status(400).json({ message: "Mechanic currently working on a job" });

    await mechanic.deleteOne();
    res.json({ message: "Mechanic deleted" });
  } catch (err) {
    console.error("deleteMechanic:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   ASSIGN MECHANIC (OWNER)
===================================================== */
exports.assignMechanic = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const mechanicId = req.body.mechanicId;

    const booking = await Booking.findById(bookingId).populate("service");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Owner check
    if (!booking.service || booking.service.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your booking" });

    const mechanic = await Mechanic.findById(mechanicId);
    if (!mechanic) return res.status(400).json({ message: "Mechanic not found" });

    if (mechanic.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Mechanic does not belong to you" });

    // Optional: check mechanic availability (no overlapping bookings)
    const conflicting = await Booking.findOne({
      mechanic: mechanicId,
      status: { $in: ["assigned", "in_progress"] },
      scheduledDate: booking.scheduledDate, // same day check, improve as needed
    });
    if (conflicting) {
      return res.status(400).json({ message: "Mechanic already assigned to another job at that time" });
    }

    booking.mechanic = mechanic._id;
    booking.status = "assigned";
    booking.assignedAt = new Date();

    await booking.save();

    res.json({ message: "Mechanic assigned successfully", booking });
  } catch (err) {
    console.error("assignMechanic:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   UNASSIGN MECHANIC (OWNER)
===================================================== */
exports.unassignMechanic = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.findById(bookingId).populate("service");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!booking.service || booking.service.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your booking" });

    booking.mechanic = null;
    booking.parts = [];
    booking.status = "accepted";
    booking.assignedAt = null;

    await booking.save();

    res.json({ message: "Mechanic unassigned", booking });
  } catch (err) {
    console.error("unassignMechanic:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   START JOB (OWNER)
===================================================== */
exports.startJob = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate("service");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!booking.service || booking.service.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your booking" });

    if (!booking.mechanic)
      return res.status(400).json({ message: "Assign mechanic first" });

    booking.status = "in_progress";
    booking.startedAt = new Date();

    await booking.save();

    res.json({ message: "Work started", booking });
  } catch (err) {
    console.error("startJob:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   COMPLETE JOB (OWNER)
===================================================== */
exports.completeJob = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate("service");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!booking.service || booking.service.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your booking" });

    if (booking.status !== "in_progress")
      return res.status(400).json({ message: "Job not started" });

    booking.status = "completed";
    booking.completedAt = new Date();

    await booking.save();

    res.json({ message: "Job completed", booking });
  } catch (err) {
    console.error("completeJob:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   GET MECHANIC BY BOOKING (CUSTOMER/ANY)
===================================================== */
exports.getMechanicByBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate("mechanic");
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!booking.mechanic) return res.status(404).json({ message: "No mechanic assigned yet" });
    res.json({ mechanic: booking.mechanic });
  } catch (err) {
    console.error("getMechanicByBooking:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   GET MY ASSIGNMENTS (MECHANIC)
===================================================== */
exports.getMyAssignments = async (req, res) => {
  try {
    const mechanic = await Mechanic.findOne({ user: req.user._id });
    if (!mechanic) return res.json([]);

    const bookings = await Booking.find({
      mechanic: mechanic._id,
      status: { $in: ["assigned", "in_progress"] },
    })
      .populate("customer", "name phone")
      .populate("service", "title price")
      .sort({ scheduledDate: 1 });

    res.json(bookings);
  } catch (err) {
    console.error("getMyAssignments:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   MECHANIC START JOB (SELF)
===================================================== */
exports.mechanicStartJob = async (req, res) => {
  try {
    const mech = await Mechanic.findOne({ user: req.user._id });
    if (!mech) return res.status(404).json({ message: "Mechanic profile not found" });

    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!booking.mechanic || booking.mechanic.toString() !== mech._id.toString())
      return res.status(403).json({ message: "You are not assigned to this booking" });

    if (booking.status !== "assigned")
      return res.status(400).json({ message: `Cannot start booking in status ${booking.status}` });

    booking.status = "in_progress";
    booking.startedAt = new Date();
    await booking.save();

    res.json({ message: "Job started", booking });
  } catch (err) {
    console.error("mechanicStartJob:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   MECHANIC COMPLETE JOB (SELF) WITH INVENTORY DEDUCTION
===================================================== */
exports.mechanicCompleteJob = async (req, res) => {
  try {
    const mech = await Mechanic.findOne({ user: req.user._id });
    if (!mech) return res.status(404).json({ message: "Mechanic profile not found" });

    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!booking.mechanic || booking.mechanic.toString() !== mech._id.toString())
      return res.status(403).json({ message: "You are not assigned to this booking" });

    if (booking.status !== "in_progress")
      return res.status(400).json({ message: "Booking is not in progress" });

    const parts = Array.isArray(req.body.partsUsed) ? req.body.partsUsed : [];

    const appliedParts = [];

    // Optional: start a session for atomicity
    // const session = await mongoose.startSession();
    // session.startTransaction();

    for (const p of parts) {
      const itemId = p.itemId || p.item;
      const qty = Number(p.qty || 0);
      if (!itemId || !qty || qty <= 0) continue;

      // Optional: check that part was reserved in booking.parts
      // const reservedPart = booking.parts.find(
      //   (rp) => rp.itemId.toString() === itemId.toString() && rp.qty >= qty
      // );
      // if (!reservedPart) {
      //   // If not reserved, you might still allow, but better to enforce
      //   return res.status(400).json({ message: `Part ${itemId} not reserved or insufficient reservation` });
      // }

      const inventory = await Inventory.findById(itemId);
      if (!inventory) return res.status(404).json({ message: `Inventory item ${itemId} not found` });

      const available = inventory.quantity - inventory.reservedQty;
      if (available < qty) {
        return res.status(400).json({
          message: `Not enough stock for ${inventory.partName}. available ${available}, requested ${qty}`,
        });
      }

      // Deduct quantity, reduce reservedQty
      inventory.quantity -= qty;
      inventory.reservedQty = Math.max(0, inventory.reservedQty - qty);
      await inventory.save();

      appliedParts.push({
        item: inventory._id,
        partName: inventory.partName,
        qty,
      });
    }

    booking.partsUsed = (booking.partsUsed || []).concat(appliedParts);
    booking.status = "completed";
    booking.completedAt = new Date();
    await booking.save();

    res.json({ message: "Job completed", booking });
  } catch (err) {
    console.error("mechanicCompleteJob:", err);
    res.status(500).json({ message: err.message });
  }
};
exports.getMyHistory = async (req, res) => {
  try {
    const mechanic = await Mechanic.findOne({ user: req.user._id });
    if (!mechanic) return res.json([]);
    const bookings = await Booking.find({
      mechanic: mechanic._id,
      status: "completed",
    })
      .populate("customer", "name")
      .populate("service", "title")
      .sort({ completedAt: -1 });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};