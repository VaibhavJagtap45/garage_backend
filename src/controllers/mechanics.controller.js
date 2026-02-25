const Mechanic = require("../models/Mechanic");
const Booking = require("../models/Booking");
const Inventory = require("../models/InventoryItem");

/* =====================================================
   ADD MECHANIC
===================================================== */
// exports.addMechanic = async (req, res) => {
//   try {
//     const mechanic = await Mechanic.create({
//       owner: req.user._id,
//       name: req.body.name,
//       phone: req.body.phone,
//       skills: req.body.skills || [],
//       experienceYears: req.body.experienceYears || 0,
//       isAvailable: true,
//     });

//     res.status(201).json({ message: "Mechanic added successfully", mechanic });
//   } catch (err) {
//     console.error("addMechanic:", err);
//     res.status(500).json({ message: err.message });
//   }
// };
exports.addMechanic = async (req, res) => {
  try {

    if (!req.body)
      return res.status(400).json({ message: "No data received" });

    let { name, phone, skills, experienceYears, isAvailable } = req.body;

    if (!name || !phone)
      return res.status(400).json({ message: "Name and phone are required" });

    // convert skills (RN sends string sometimes)
    if (typeof skills === "string") {
      skills = skills.split(",").map(s => s.trim()).filter(Boolean);
    }

    const mechanic = await Mechanic.create({
      owner: req.user._id,
      name,
      phone,
      skills: skills || [],
      experienceYears: Number(experienceYears) || 0,
      isAvailable: isAvailable === "true" || isAvailable === true
    });

    res.status(201).json({
      message: "Mechanic added successfully",
      mechanic
    });

  } catch (err) {
    console.error("addMechanic:", err);
    res.status(500).json({ message: err.message });
  }
};
/* =====================================================
   GET MECHANICS
===================================================== */
exports.getMechanics = async (req, res) => {
  try {
    const mechanics = await Mechanic.find({ owner: req.user._id }).sort({ createdAt: -1 });
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

    if (mechanic.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not allowed" });

    // Object.assign(mechanic, req.body);
    if (req.body.name !== undefined) mechanic.name = req.body.name;
if (req.body.phone !== undefined) mechanic.phone = req.body.phone;
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
   DELETE MECHANIC
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
   ASSIGN MECHANIC
===================================================== */
exports.assignMechanic = async (req, res) => {
  try {

    // SAFE BODY CHECK
    if (!req.body || !req.body.mechanicId) {
      return res.status(400).json({
        message: "mechanicId is required"
      });
    }

    const bookingId = req.params.bookingId;
    const mechanicId = req.body.mechanicId;

    const booking = await Booking.findById(bookingId).populate("service");
    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    // owner check
    if (!booking.service || booking.service.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your booking" });

    const mechanic = await Mechanic.findById(mechanicId);
    if (!mechanic)
      return res.status(400).json({ message: "Mechanic not found" });

    if (mechanic.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Mechanic does not belong to you" });

    booking.mechanic = mechanic._id;
    booking.status = "assigned";
    booking.assignedAt = new Date();

    await booking.save();

    res.json({
      message: "Mechanic assigned successfully",
      booking
    });

  } catch (err) {
    console.error("assignMechanic:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   UNASSIGN MECHANIC
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
   START WORK (NO PAYMENT CHECK)
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
   COMPLETE JOB
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
   CUSTOMER VIEW MECHANIC
===================================================== */
exports.getMechanicByBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate("mechanic");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!booking.mechanic)
      return res.status(404).json({ message: "No mechanic assigned yet" });

    res.json({ mechanic: booking.mechanic });
  } catch (err) {
    console.error("getMechanicByBooking:", err);
    res.status(500).json({ message: err.message });
  }
};