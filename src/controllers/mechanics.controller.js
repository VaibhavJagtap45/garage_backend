const Mechanic = require("../models/Mechanic");
const Booking = require("../models/Booking");
const Inventory = require("../models/InventoryItem");


/* =====================================================
   ADD MECHANIC (OWNER ONLY)
===================================================== */
exports.addMechanic = async (req, res) => {
  try {
    const mechanic = await Mechanic.create({
      owner: req.user._id,
      name: req.body.name,
      phone: req.body.phone,
      skills: req.body.skills || [],
      experienceYears: req.body.experienceYears || 0,
      isAvailable: true,
    });

    res.status(201).json({
      message: "Mechanic added successfully",
      mechanic,
    });
  } catch (err) {
    console.error("addMechanic:", err);
    res.status(500).json({ message: err.message });
  }
};


/* =====================================================
   GET MECHANICS (OWNER DASHBOARD + CUSTOMER VIEW)
===================================================== */
exports.getMechanics = async (req, res) => {
  try {
    let query = {};

    // owner sees only his mechanics
    if (req.user.role === "owner") {
      query.owner = req.user._id;
    }

    const mechanics = await Mechanic.find(query).sort({ createdAt: -1 });

    res.json(mechanics);
  } catch (err) {
    console.error("getMechanics:", err);
    res.status(500).json({ message: err.message });
  }
};


/* =====================================================
   UPDATE MECHANIC
===================================================== */
exports.updateMechanic = async (req, res) => {
  try {
    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) return res.status(404).json({ message: "Mechanic not found" });

    // permission check
    if (mechanic.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "You cannot edit this mechanic" });

    mechanic.name = req.body.name ?? mechanic.name;
    mechanic.phone = req.body.phone ?? mechanic.phone;
    mechanic.skills = req.body.skills ?? mechanic.skills;
    mechanic.experienceYears = req.body.experienceYears ?? mechanic.experienceYears;
    mechanic.isAvailable = req.body.isAvailable ?? mechanic.isAvailable;

    await mechanic.save();

    res.json({
      message: "Mechanic updated successfully",
      mechanic,
    });
  } catch (err) {
    console.error("updateMechanic:", err);
    res.status(500).json({ message: err.message });
  }
};


/* =====================================================
   DELETE MECHANIC
===================================================== */
exports.deleteMechanic = async (req, res) => {
  try {
    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) return res.status(404).json({ message: "Mechanic not found" });

    // permission check
    if (mechanic.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "You cannot delete this mechanic" });

    // check if assigned in active booking
    const activeBooking = await Booking.findOne({
      mechanic: mechanic._id,
      status: { $in: ["assigned", "accepted", "in_progress"] },
    });

    if (activeBooking)
      return res.status(400).json({
        message: "Cannot delete mechanic. Assigned to an active booking",
      });

    await mechanic.deleteOne();

    res.json({ message: "Mechanic deleted successfully" });
  } catch (err) {
    console.error("deleteMechanic:", err);
    res.status(500).json({ message: err.message });
  }
};


/* =====================================================
   ASSIGN MECHANIC TO BOOKING + RESERVE PARTS
===================================================== */
exports.assignMechanic = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { mechanicId, parts = [] } = req.body;

    const booking = await Booking.findById(bookingId).populate("service");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // ensure owner owns service
    if (!booking.service || booking.service.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "This booking is not yours" });

    const mechanic = await Mechanic.findById(mechanicId);
    if (!mechanic || mechanic.owner.toString() !== req.user._id.toString())
      return res.status(400).json({ message: "Invalid mechanic selected" });

    // reserve inventory parts
    const reservedParts = [];
    for (const p of parts) {
      const item = await Inventory.findOneAndUpdate(
        {
          _id: p.itemId,
          owner: req.user._id,
          $expr: { $gte: [{ $subtract: ["$quantity", "$reservedQty"] }, p.qty] },
        },
        { $inc: { reservedQty: p.qty } },
        { new: true }
      );

      if (!item) {
        // rollback previous reservations
        for (const r of reservedParts) {
          await Inventory.findByIdAndUpdate(r.itemId, {
            $inc: { reservedQty: -r.qty },
          });
        }
        return res.status(400).json({ message: "Insufficient stock", itemId: p.itemId });
      }

      reservedParts.push({ itemId: p.itemId, qty: p.qty });
    }

    booking.mechanic = mechanicId;
    booking.parts = reservedParts;
    booking.status = "assigned";
    booking.assignedAt = new Date();

    await booking.save();

    res.json({
      message: "Mechanic assigned successfully",
      booking,
    });
  } catch (err) {
    console.error("assignMechanic:", err);
    res.status(500).json({ message: err.message });
  }
};


/* =====================================================
   START JOB
===================================================== */
exports.startJob = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    // if (!booking) return res.status(404).json({ message: "Booking not found" });
if (booking.paymentStatus !== "paid")
  return res.status(400).json({ message: "Customer has not paid yet" });
    if (booking.status !== "assigned")
      return res.status(400).json({ message: "Booking must be assigned first" });

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
   COMPLETE JOB (DEDUCT INVENTORY)
===================================================== */
exports.completeJob = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.status !== "in_progress")
      return res.status(400).json({ message: "Job has not started yet" });

    // deduct reserved parts
    for (const p of booking.parts || []) {
      await Inventory.findByIdAndUpdate(
        p.itemId,
        { $inc: { quantity: -p.qty, reservedQty: -p.qty } }
      );
    }

    booking.status = "completed";
    booking.completedAt = new Date();
    await booking.save();

    res.json({
      message: "Job completed successfully",
      booking,
    });
  } catch (err) {
    console.error("completeJob:", err);
    res.status(500).json({ message: err.message });
  }
};