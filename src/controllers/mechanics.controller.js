// const Mechanic = require("../models/Mechanic");
// const Booking = require("../models/Booking");
// const Inventory = require("../models/InventoryItem");
// const User = require("../models/User");
// // at top of file (optional helper)
// // const debugLog = (...args) => console.log("[mechanicReq]", ...args);

// /* =====================================================
//    ADD MECHANIC (OWNER)
// ===================================================== */
// exports.addMechanic = async (req, res) => {
//   try {
//     let { name, phone, skills, experienceYears, isAvailable } = req.body;

//     if (!name || !phone)
//       return res.status(400).json({ message: "Name and phone are required" });

//     // Normalize phone
//     const normalizedPhone = phone.replace(/\D/g, "");

//     // Find registered mechanic user
//     const user = await User.findOne({ phone: normalizedPhone, role: "mechanic" });

//     if (!user)
//       return res.status(400).json({
//         message: "Mechanic must register app account first using same phone number",
//       });

//     // Check if already linked
//     const existing = await Mechanic.findOne({ user: user._id });
//     if (existing)
//       return res.status(400).json({ message: "This mechanic account already linked" });

//     if (typeof skills === "string") {
//       skills = skills.split(",").map((s) => s.trim()).filter(Boolean);
//     }

//     const mechanic = await Mechanic.create({
//       owner: req.user._id,
//       user: user._id,
//       name,
//       phone: normalizedPhone,
//       skills: skills || [],
//       experienceYears: Number(experienceYears) || 0,
//       isAvailable: true,
//     });

//     res.status(201).json({ message: "Mechanic linked successfully", mechanic });
//   } catch (err) {
//     console.error("addMechanic:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// /* =====================================================
//    GET MECHANICS (OWNER)
// ===================================================== */
// exports.getMechanics = async (req, res) => {
//   try {
//     const mechanics = await Mechanic.find({ owner: req.user._id })
//       .populate("user", "name phone email avatar")
//       .sort({ createdAt: -1 });
//     res.json(mechanics);
//   } catch (err) {
//     console.error("getMechanics:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// /* =====================================================
//    UPDATE MECHANIC (OWNER)
// ===================================================== */
// exports.updateMechanic = async (req, res) => {
//   try {
//     const mechanic = await Mechanic.findById(req.params.id);
//     if (!mechanic) return res.status(404).json({ message: "Mechanic not found" });

//     if (mechanic.owner.toString() !== req.user._id.toString())
//       return res.status(403).json({ message: "Not allowed" });

//     if (req.body.name !== undefined) mechanic.name = req.body.name;
//     if (req.body.phone !== undefined) mechanic.phone = req.body.phone.replace(/\D/g, "");
//     if (req.body.skills !== undefined) mechanic.skills = req.body.skills;
//     if (req.body.experienceYears !== undefined) mechanic.experienceYears = req.body.experienceYears;
//     if (req.body.isAvailable !== undefined) mechanic.isAvailable = req.body.isAvailable;

//     await mechanic.save();
//     res.json({ message: "Mechanic updated", mechanic });
//   } catch (err) {
//     console.error("updateMechanic:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// /* =====================================================
//    DELETE MECHANIC (OWNER)
// ===================================================== */
// exports.deleteMechanic = async (req, res) => {
//   try {
//     const mechanic = await Mechanic.findById(req.params.id);
//     if (!mechanic) return res.status(404).json({ message: "Mechanic not found" });

//     if (mechanic.owner.toString() !== req.user._id.toString())
//       return res.status(403).json({ message: "Not allowed" });

//     const active = await Booking.findOne({
//       mechanic: mechanic._id,
//       status: { $in: ["assigned", "in_progress"] },
//     });

//     if (active)
//       return res.status(400).json({ message: "Mechanic currently working on a job" });

//     await mechanic.deleteOne();
//     res.json({ message: "Mechanic deleted" });
//   } catch (err) {
//     console.error("deleteMechanic:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// /* =====================================================
//    ASSIGN MECHANIC (OWNER)
// ===================================================== */
// exports.assignMechanic = async (req, res) => {
//   try {
//     const bookingId = req.params.bookingId;
//     const mechanicId = req.body.mechanicId;

//     const booking = await Booking.findById(bookingId).populate("service");
//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     // Owner check
//     if (!booking.service || booking.service.owner.toString() !== req.user._id.toString())
//       return res.status(403).json({ message: "Not your booking" });

//     const mechanic = await Mechanic.findById(mechanicId);
//     if (!mechanic) return res.status(400).json({ message: "Mechanic not found" });

//     if (mechanic.owner.toString() !== req.user._id.toString())
//       return res.status(403).json({ message: "Mechanic does not belong to you" });

//     // Optional: check mechanic availability (no overlapping bookings)
//     const conflicting = await Booking.findOne({
//       mechanic: mechanicId,
//       status: { $in: ["assigned", "in_progress"] },
//       scheduledDate: booking.scheduledDate, // same day check, improve as needed
//     });
//     if (conflicting) {
//       return res.status(400).json({ message: "Mechanic already assigned to another job at that time" });
//     }

//     booking.mechanic = mechanic._id;
//     booking.status = "assigned";
//     booking.assignedAt = new Date();

//     await booking.save();

//     res.json({ message: "Mechanic assigned successfully", booking });
//   } catch (err) {
//     console.error("assignMechanic:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// /* =====================================================
//    UNASSIGN MECHANIC (OWNER)
// ===================================================== */
// exports.unassignMechanic = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const booking = await Booking.findById(bookingId).populate("service");
//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     if (!booking.service || booking.service.owner.toString() !== req.user._id.toString())
//       return res.status(403).json({ message: "Not your booking" });

//     booking.mechanic = null;
//     booking.parts = [];
//     booking.status = "accepted";
//     booking.assignedAt = null;

//     await booking.save();

//     res.json({ message: "Mechanic unassigned", booking });
//   } catch (err) {
//     console.error("unassignMechanic:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// /* =====================================================
//    START JOB (OWNER)
// ===================================================== */
// exports.startJob = async (req, res) => {
//   try {
//     const booking = await Booking.findById(req.params.bookingId).populate("service");
//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     if (!booking.service || booking.service.owner.toString() !== req.user._id.toString())
//       return res.status(403).json({ message: "Not your booking" });

//     if (!booking.mechanic)
//       return res.status(400).json({ message: "Assign mechanic first" });

//     booking.status = "in_progress";
//     booking.startedAt = new Date();

//     await booking.save();

//     res.json({ message: "Work started", booking });
//   } catch (err) {
//     console.error("startJob:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// /* =====================================================
//    COMPLETE JOB (OWNER)
// ===================================================== */
// exports.completeJob = async (req, res) => {
//   try {
//     const booking = await Booking.findById(req.params.bookingId).populate("service");
//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     if (!booking.service || booking.service.owner.toString() !== req.user._id.toString())
//       return res.status(403).json({ message: "Not your booking" });

//     if (booking.status !== "in_progress")
//       return res.status(400).json({ message: "Job not started" });

//     booking.status = "completed";
//     booking.completedAt = new Date();

//     await booking.save();

//     res.json({ message: "Job completed", booking });
//   } catch (err) {
//     console.error("completeJob:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// /* =====================================================
//    GET MECHANIC BY BOOKING (CUSTOMER/ANY)
// ===================================================== */
// exports.getMechanicByBooking = async (req, res) => {
//   try {
//     const booking = await Booking.findById(req.params.bookingId).populate("mechanic");
//     if (!booking) return res.status(404).json({ message: "Booking not found" });
//     if (!booking.mechanic) return res.status(404).json({ message: "No mechanic assigned yet" });
//     res.json({ mechanic: booking.mechanic });
//   } catch (err) {
//     console.error("getMechanicByBooking:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// /* =====================================================
//    GET MY ASSIGNMENTS (MECHANIC)
// ===================================================== */
// exports.getMyAssignments = async (req, res) => {
//   try {
//     const mechanic = await Mechanic.findOne({ user: req.user._id });
//     if (!mechanic) return res.json([]);

//     const bookings = await Booking.find({
//       mechanic: mechanic._id,
//       status: { $in: ["assigned", "in_progress"] },
//     })
//       .populate("customer", "name phone")
//       .populate("service", "title price")
//       .sort({ scheduledDate: 1 });

//     res.json(bookings);
//   } catch (err) {
//     console.error("getMyAssignments:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// /* =====================================================
//    MECHANIC START JOB (SELF)
// ===================================================== */
// exports.mechanicStartJob = async (req, res) => {
//   try {
//     const mech = await Mechanic.findOne({ user: req.user._id });
//     if (!mech) return res.status(404).json({ message: "Mechanic profile not found" });

//     const booking = await Booking.findById(req.params.bookingId);
//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     if (!booking.mechanic || booking.mechanic.toString() !== mech._id.toString())
//       return res.status(403).json({ message: "You are not assigned to this booking" });

//     if (booking.status !== "assigned")
//       return res.status(400).json({ message: `Cannot start booking in status ${booking.status}` });

//     booking.status = "in_progress";
//     booking.startedAt = new Date();
//     await booking.save();

//     res.json({ message: "Job started", booking });
//   } catch (err) {
//     console.error("mechanicStartJob:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// /* =====================================================
//    MECHANIC COMPLETE JOB (SELF) WITH INVENTORY DEDUCTION
// ===================================================== */
// exports.mechanicCompleteJob = async (req, res) => {
//   try {
//     const mech = await Mechanic.findOne({ user: req.user._id });
//     if (!mech) return res.status(404).json({ message: "Mechanic profile not found" });

//     const booking = await Booking.findById(req.params.bookingId);
//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     if (!booking.mechanic || booking.mechanic.toString() !== mech._id.toString())
//       return res.status(403).json({ message: "You are not assigned to this booking" });

//     if (booking.status !== "in_progress")
//       return res.status(400).json({ message: "Booking is not in progress" });

//     const parts = Array.isArray(req.body.partsUsed) ? req.body.partsUsed : [];

//     const appliedParts = [];

//     // Optional: start a session for atomicity
//     // const session = await mongoose.startSession();
//     // session.startTransaction();

//     for (const p of parts) {
//       const itemId = p.itemId || p.item;
//       const qty = Number(p.qty || 0);
//       if (!itemId || !qty || qty <= 0) continue;

//       // Optional: check that part was reserved in booking.parts
//       // const reservedPart = booking.parts.find(
//       //   (rp) => rp.itemId.toString() === itemId.toString() && rp.qty >= qty
//       // );
//       // if (!reservedPart) {
//       //   // If not reserved, you might still allow, but better to enforce
//       //   return res.status(400).json({ message: `Part ${itemId} not reserved or insufficient reservation` });
//       // }

//       const inventory = await Inventory.findById(itemId);
//       if (!inventory) return res.status(404).json({ message: `Inventory item ${itemId} not found` });

//       const available = inventory.quantity - inventory.reservedQty;
//       if (available < qty) {
//         return res.status(400).json({
//           message: `Not enough stock for ${inventory.partName}. available ${available}, requested ${qty}`,
//         });
//       }

//       // Deduct quantity, reduce reservedQty
//       inventory.quantity -= qty;
//       inventory.reservedQty = Math.max(0, inventory.reservedQty - qty);
//       await inventory.save();

//       appliedParts.push({
//         item: inventory._id,
//         partName: inventory.partName,
//         qty,
//       });
//     }

//     booking.partsUsed = (booking.partsUsed || []).concat(appliedParts);
//     booking.status = "completed";
//     booking.completedAt = new Date();
//     await booking.save();

//     res.json({ message: "Job completed", booking });
//   } catch (err) {
//     console.error("mechanicCompleteJob:", err);
//     res.status(500).json({ message: err.message });
//   }
// };
// exports.getMyHistory = async (req, res) => {
//   try {
//     const mechanic = await Mechanic.findOne({ user: req.user._id });
//     if (!mechanic) return res.json([]);
//     const bookings = await Booking.find({
//       mechanic: mechanic._id,
//       status: "completed",
//     })
//       .populate("customer", "name")
//       .populate("service", "title")
//       .sort({ completedAt: -1 });
//     res.json(bookings);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// // ========== MECHANIC REQUEST FUNCTIONS ==========
// const MechanicRequest = require("../models/MechanicRequest");

// // List all garages (owners with garageName)
// exports.listGarages = async (req, res) => {
//   try {
//     const garages = await User.find({ role: "owner", garageName: { $ne: null } })
//       .select("name garageName garageAddress email phone");
//     res.json(garages);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // Mechanic applies to a garage
// // exports.applyToGarage = async (req, res) => {
// //   try {
// //     const { ownerId, message } = req.body;
// //     const mechanicId = req.user._id;

// //     const owner = await User.findOne({ _id: ownerId, role: "owner" });
// //     if (!owner) return res.status(404).json({ message: "Garage not found" });

// //     const existing = await MechanicRequest.findOne({ mechanic: mechanicId, owner: ownerId });
// //     if (existing) return res.status(400).json({ message: "You have already applied to this garage" });

// //     const alreadyLinked = await Mechanic.findOne({ user: mechanicId, owner: ownerId });
// //     if (alreadyLinked) return res.status(400).json({ message: "You are already a mechanic at this garage" });

// //     const request = await MechanicRequest.create({ mechanic: mechanicId, owner: ownerId, message });
// //     res.status(201).json(request);
// //   } catch (err) {
// //     res.status(500).json({ message: err.message });
// //   }
// // };

// // at top of file (optional helper)
// const debugLog = (...args) => console.log("[mechanicReq]", ...args);

// // applyToGarage
// exports.applyToGarage = async (req, res) => {
//   try {
//     debugLog("applyToGarage hit, user:", req.user ? req.user._id : null, "body:", req.body);
//     const { ownerId, message } = req.body;
//     const mechanicId = req.user._id;

//     const owner = await User.findOne({ _id: ownerId, role: "owner" });
//     debugLog("found owner:", !!owner);
//     if (!owner) return res.status(404).json({ message: "Garage not found" });

//     const existing = await MechanicRequest.findOne({ mechanic: mechanicId, owner: ownerId ,status: "pending"});
//     debugLog("existing request:", existing ? existing._id : null, "status:", existing ? existing.status : null);
//     if (existing) return res.status(400).json({ message: "You have already applied to this garage" });

//     const alreadyLinked = await Mechanic.findOne({ user: mechanicId, owner: ownerId });
//     debugLog("alreadyLinked:", !!alreadyLinked);
//     if (alreadyLinked) return res.status(400).json({ message: "You are already a mechanic at this garage" });

//     const request = await MechanicRequest.create({ mechanic: mechanicId, owner: ownerId, message });
//     debugLog("created request:", request._id);
//     res.status(201).json(request);
//   } catch (err) {
//     console.error("applyToGarage error:", err);
//     res.status(500).json({ message: err.message });
//   }
// };

// // at top of file (optional helper)
// // const debugLog = (...args) => console.log("[mechanicReq]", ...args);


// // getPendingRequestsForOwner
// exports.getPendingRequestsForOwner = async (req, res) => {
//   try {
//     debugLog("getPendingRequestsForOwner user:", req.user ? req.user._id : null);
//     const requests = await MechanicRequest.find({ owner: req.user._id, status: "pending" })
//       .populate("mechanic", "name email phone");
//     debugLog("pending requests count:", requests.length);
//     res.json(requests);
//   } catch (err) {
//     console.error("getPendingRequestsForOwner error:", err);
//     res.status(500).json({ message: err.message });
//   }
// };
// // Mechanic view their requests
// exports.getMyRequests = async (req, res) => {
//   try {
//     const requests = await MechanicRequest.find({ mechanic: req.user._id })
//       .populate("owner", "garageName name email");
//     res.json(requests);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // Owner view pending requests
// // exports.getPendingRequestsForOwner = async (req, res) => {
// //   try {
// //     const requests = await MechanicRequest.find({ owner: req.user._id, status: "pending" })
// //       .populate("mechanic", "name email phone");
// //     res.json(requests);
// //   } catch (err) {
// //     res.status(500).json({ message: err.message });
// //   }
// // };

// // Approve a request
// exports.approveRequest = async (req, res) => {
//   try {
//     const request = await MechanicRequest.findById(req.params.requestId);
//     if (!request) return res.status(404).json({ message: "Request not found" });
//     if (request.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not your request" });
//     if (request.status !== "pending") return res.status(400).json({ message: "Request already processed" });

//     let mechanic = await Mechanic.findOne({ user: request.mechanic, owner: request.owner });
//     if (!mechanic) {
//       const user = await User.findById(request.mechanic);
//       mechanic = await Mechanic.create({
//         owner: request.owner,
//         user: request.mechanic,
//         name: user.name,
//         phone: user.phone,
//         skills: [],
//         experienceYears: 0,
//         isAvailable: true,
//       });
//     }

//     request.status = "approved";
//     request.respondedAt = new Date();
//     await request.save();
//     res.json({ message: "Request approved", mechanic });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// // Reject a request
// exports.rejectRequest = async (req, res) => {
//   try {
//     const request = await MechanicRequest.findById(req.params.requestId);
//     if (!request) return res.status(404).json({ message: "Request not found" });
//     if (request.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: "Not your request" });
//     if (request.status !== "pending") return res.status(400).json({ message: "Request already processed" });

//     request.status = "rejected";
//     request.respondedAt = new Date();
//     await request.save();
//     res.json({ message: "Request rejected" });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// exports.myGarageStatus = async (req, res) => {
//   try {
//     const mechanic = await Mechanic.findOne({ user: req.user._id })
//       .populate("owner", "garageName name phone email");

//     if (!mechanic) {
//       return res.json({
//         joined: false
//       });
//     }

//     res.json({
//       joined: true,
//       garage: mechanic.owner
//     });

//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };





























// src/controllers/mechanics.controller.js
const mongoose = require("mongoose");
const Mechanic = require("../models/Mechanic");
const Booking = require("../models/Booking");
const Inventory = require("../models/InventoryItem");
const User = require("../models/User");
const MechanicRequest = require("../models/MechanicRequest");

/* =====================================================
   Helpers
===================================================== */
const isValidId = (id) => {
  try {
    return mongoose.Types.ObjectId.isValid(String(id));
  } catch {
    return false;
  }
};

const toObjectId = (id) => {
  if (!isValidId(id)) throw new Error("Invalid id");
  return new mongoose.Types.ObjectId(String(id));
};

/* =====================================================
   OWNER: ADD MECHANIC (link registered mechanic user)
===================================================== */
exports.addMechanic = async (req, res) => {
  try {
    let { name, phone, skills, experienceYears, isAvailable } = req.body;

    if (!name || !phone)
      return res.status(400).json({ message: "Name and phone are required" });

    const normalizedPhone = String(phone).replace(/\D/g, "");

    const user = await User.findOne({ phone: normalizedPhone, role: "mechanic" });
    if (!user)
      return res.status(400).json({
        message: "Mechanic must register app account first using same phone number",
      });

    const existing = await Mechanic.findOne({ user: user._id, owner: req.user._id });
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
      isAvailable: typeof isAvailable === "boolean" ? isAvailable : true,
    });

    res.status(201).json({ message: "Mechanic linked successfully", mechanic });
  } catch (err) {
    console.error("addMechanic:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   OWNER: GET MECHANICS
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
   OWNER: UPDATE MECHANIC
===================================================== */
exports.updateMechanic = async (req, res) => {
  try {
    const mechanic = await Mechanic.findById(req.params.id);
    if (!mechanic) return res.status(404).json({ message: "Mechanic not found" });

    if (mechanic.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not allowed" });

    if (req.body.name !== undefined) mechanic.name = req.body.name;
    if (req.body.phone !== undefined) mechanic.phone = String(req.body.phone).replace(/\D/g, "");
    if (req.body.skills !== undefined) mechanic.skills = req.body.skills;
    if (req.body.experienceYears !== undefined) mechanic.experienceYears = Number(req.body.experienceYears) || 0;
    if (req.body.isAvailable !== undefined) mechanic.isAvailable = !!req.body.isAvailable;

    await mechanic.save();
    res.json({ message: "Mechanic updated", mechanic });
  } catch (err) {
    console.error("updateMechanic:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   OWNER: DELETE MECHANIC
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
   OWNER: ASSIGN MECHANIC TO BOOKING
===================================================== */
exports.assignMechanic = async (req, res) => {
  try {
    const bookingId = req.params.bookingId;
    const mechanicId = req.body.mechanicId;

    const booking = await Booking.findById(bookingId).populate("service");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (!booking.service || booking.service.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your booking" });

    const mechanic = await Mechanic.findById(mechanicId);
    if (!mechanic) return res.status(400).json({ message: "Mechanic not found" });

    if (mechanic.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Mechanic does not belong to you" });

    const conflicting = await Booking.findOne({
      mechanic: mechanicId,
      status: { $in: ["assigned", "in_progress"] },
      scheduledDate: booking.scheduledDate,
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
   OWNER: UNASSIGN MECHANIC
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
   OWNER: START JOB
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
   OWNER: COMPLETE JOB (no inventory deduction)
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
   CUSTOMER/ANY: GET MECHANIC BY BOOKING
===================================================== */
exports.getMechanicByBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate({
      path: "mechanic",
      populate: { path: "user", select: "name phone email" },
    });
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (!booking.mechanic) return res.status(404).json({ message: "No mechanic assigned yet" });
    res.json({ mechanic: booking.mechanic });
  } catch (err) {
    console.error("getMechanicByBooking:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   MECHANIC: MY ASSIGNMENTS
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
   MECHANIC: START JOB (SELF)
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
   MECHANIC: COMPLETE JOB (SELF) WITH INVENTORY DEDUCTION
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

    for (const p of parts) {
      const itemId = p.itemId || p.item;
      const qty = Number(p.qty || 0);
      if (!itemId || !qty || qty <= 0) continue;

      const inventory = await Inventory.findById(itemId);
      if (!inventory) return res.status(404).json({ message: `Inventory item ${itemId} not found` });

      const available = (inventory.quantity || 0) - (inventory.reservedQty || 0);
      if (available < qty) {
        return res.status(400).json({
          message: `Not enough stock for ${inventory.partName}. available ${available}, requested ${qty}`,
        });
      }

      inventory.quantity -= qty;
      inventory.reservedQty = Math.max(0, (inventory.reservedQty || 0) - qty);
      await inventory.save();

      appliedParts.push({ item: inventory._id, partName: inventory.partName, qty });
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

/* =====================================================
   MECHANIC: HISTORY
===================================================== */
exports.getMyHistory = async (req, res) => {
  try {
    const mechanic = await Mechanic.findOne({ user: req.user._id });
    if (!mechanic) return res.json([]);

    const bookings = await Booking.find({ mechanic: mechanic._id, status: "completed" })
      .populate("customer", "name")
      .populate("service", "title")
      .sort({ completedAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("getMyHistory:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   MECHANIC REQUESTS: LIST GARAGES
===================================================== */
exports.listGarages = async (req, res) => {
  try {
    const garages = await User.find({ role: "owner", garageName: { $exists: true, $ne: "" } })
      .select("name garageName garageAddress email phone")
      .sort({ garageName: 1 });
    res.json(garages);
  } catch (err) {
    console.error("listGarages:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   MECHANIC REQUESTS: APPLY TO GARAGE
   - store Mechanic._id (not User._id)
   - validate ownerId
   - avoid duplicate pending requests
===================================================== */
exports.applyToGarage = async (req, res) => {
  try {
    const { ownerId, message } = req.body;

    if (!ownerId || !isValidId(ownerId))
      return res.status(400).json({ message: "Invalid garage" });

    const owner = await User.findOne({ _id: ownerId, role: "owner" });
    if (!owner)
      return res.status(404).json({ message: "Garage not found" });

    // 🔥 IMPORTANT: use USER id, NOT Mechanic id
    const existing = await MechanicRequest.findOne({
      mechanic: req.user._id,
      owner: ownerId,
      status: "pending",
    });

    if (existing)
      return res.status(400).json({ message: "Already applied to this garage" });

    const request = await MechanicRequest.create({
      mechanic: req.user._id, // <-- store user id
      owner: ownerId,
      message: message || "",
      status: "pending",
    });

    res.status(201).json({
      message: "Application sent successfully",
      request,
    });

  } catch (err) {
    console.error("applyToGarage:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   MECHANIC REQUESTS: MY REQUESTS
   - find by mechanic profile id
===================================================== */
exports.getMyRequests = async (req, res) => {
  try {
    // STEP 1: find mechanic profile
    const mechanic = await Mechanic.findOne({ user: req.user._id });

    if (!mechanic) {
      return res.json([]);
    }

    // STEP 2: find requests using mechanic._id
    // const requests = await MechanicRequest.find({ mechanic: mechanic._id })
    //   .populate("owner", "garageName name email phone")
    //   .sort({ createdAt: -1 });
const requests = await MechanicRequest.find({ mechanic: req.user._id })
  .populate("owner", "garageName name email phone")
  .sort({ createdAt: -1 });
  
    res.json(requests);
  } catch (err) {
    console.error("getMyRequests:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   OWNER: PENDING REQUESTS
   - robustly return mechanic info even if legacy requests reference User._id
===================================================== */
exports.getPendingRequestsForOwner = async (req, res) => {
  try {
    const ownerId = toObjectId(req.user._id);

    // fetch requests first (no population) and then normalize mechanic info per-request
    const requests = await MechanicRequest.find({ owner: ownerId, status: "pending" })
      .sort({ createdAt: -1 });

    // normalize: for each request, resolve mechanic as Mechanic (with user) OR as User (legacy)
    const normalized = await Promise.all(
      requests.map(async (r) => {
        let mechDoc = null;
        // try as Mechanic id
        if (isValidId(r.mechanic)) {
          mechDoc = await Mechanic.findById(r.mechanic).populate("user", "name phone email");
        }
        if (!mechDoc) {
          // fallback: attempt to treat r.mechanic as a User id (legacy data)
          if (isValidId(r.mechanic)) {
            const userDoc = await User.findById(r.mechanic).select("name phone email");
            if (userDoc) {
              mechDoc = {
                _id: null,
                user: userDoc,
                name: userDoc.name || "Mechanic",
                phone: userDoc.phone || "",
                legacyUserRef: true,
              };
            }
          }
        }

        return {
          _id: r._id,
          owner: r.owner,
          message: r.message,
          status: r.status,
          createdAt: r.createdAt,
          respondedAt: r.respondedAt,
          mechanic: mechDoc, // either Mechanic doc with nested user or a small object built from User
        };
      })
    );

    res.json(normalized);
  } catch (err) {
    console.error("getPendingRequestsForOwner:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   OWNER: APPROVE REQUEST
   - support requests that reference Mechanic._id OR legacy User._id
   - ensure a Mechanic doc exists for the user and that mechanic.owner is set
===================================================== */
// exports.approveRequest = async (req, res) => {
//   try {
//     const request = await MechanicRequest.findById(req.params.requestId);
//     if (!request) return res.status(404).json({ message: "Request not found" });

//     if (request.owner.toString() !== req.user._id.toString())
//       return res.status(403).json({ message: "Not your request" });

//     if (request.status !== "pending")
//       return res.status(400).json({ message: "Already processed" });

//     let mechanicDoc = null;

//     // Case A: request.mechanic already stores Mechanic._id
//     if (isValidId(request.mechanic)) {
//       mechanicDoc = await Mechanic.findById(request.mechanic);
//     }

//     // Case B: request.mechanic was legacy User._id — find Mechanic by user
//     if (!mechanicDoc) {
//       // try treat request.mechanic as a user id
//       const possibleUserId = request.mechanic;
//       if (isValidId(possibleUserId)) {
//         const user = await User.findById(possibleUserId);
//         if (user) {
//           mechanicDoc = await Mechanic.findOne({ user: user._id, owner: request.owner });
//           if (!mechanicDoc) {
//             // create mechanic profile and link to owner
//             mechanicDoc = await Mechanic.create({
//               owner: request.owner,
//               user: user._id,
//               name: user.name || "Mechanic",
//               phone: user.phone || "",
//               skills: [],
//               experienceYears: 0,
//               isAvailable: true,
//             });
//           } else {
//             // ensure owner is set (defensive)
//             if (!mechanicDoc.owner || mechanicDoc.owner.toString() !== request.owner.toString()) {
//               mechanicDoc.owner = request.owner;
//               await mechanicDoc.save();
//             }
//           }
//         }
//       }
//     } else {
//       // mechanicDoc found by id: ensure owner set to this owner
//       if (!mechanicDoc.owner || mechanicDoc.owner.toString() !== request.owner.toString()) {
//         mechanicDoc.owner = request.owner;
//         await mechanicDoc.save();
//       }
//     }

//     if (!mechanicDoc) {
//       // If for some reason we still don't have a mechanic, return error
//       return res.status(500).json({ message: "Failed to resolve mechanic profile for this request" });
//     }

//     // mark request approved
//     request.status = "approved";
//     request.respondedAt = new Date();
//     await request.save();

//     // return mechanic (fresh)
//     const mechanicFresh = await Mechanic.findById(mechanicDoc._id).populate("user", "name phone email");
//     res.json({ message: "Mechanic approved", mechanic: mechanicFresh });
//   } catch (err) {
//     console.error("approveRequest:", err);
//     res.status(500).json({ message: err.message });
//   }
// };
exports.approveRequest = async (req, res) => {
  try {
    const request = await MechanicRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your request" });

    if (request.status !== "pending")
      return res.status(400).json({ message: "Already processed" });

    // get user
    const user = await User.findById(request.mechanic);
    if (!user) return res.status(404).json({ message: "User not found" });

    // 🔥 CREATE MECHANIC PROFILE HERE
    const mechanic = await Mechanic.create({
      owner: request.owner,
      user: user._id,
      name: user.name,
      phone: user.phone,
      skills: [],
      experienceYears: 0,
      isAvailable: true,
    });

    request.status = "approved";
    request.respondedAt = new Date();
    await request.save();

    res.json({ message: "Mechanic approved", mechanic });

  } catch (err) {
    console.error("approveRequest:", err);
    res.status(500).json({ message: err.message });
  }
};
/* =====================================================
   OWNER: REJECT REQUEST
===================================================== */
exports.rejectRequest = async (req, res) => {
  try {
    const request = await MechanicRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });

    if (request.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your request" });

    request.status = "rejected";
    request.respondedAt = new Date();
    await request.save();

    res.json({ message: "Request rejected" });
  } catch (err) {
    console.error("rejectRequest:", err);
    res.status(500).json({ message: err.message });
  }
};

/* =====================================================
   MECHANIC: MY GARAGE STATUS
===================================================== */
exports.myGarageStatus = async (req, res) => {
  try {
    const mechanic = await Mechanic.findOne({ user: req.user._id })
      .populate("owner", "garageName name phone email");

    if (!mechanic) return res.json({ joined: false });

    res.json({ joined: true, garage: mechanic.owner });
  } catch (err) {
    console.error("myGarageStatus:", err);
    res.status(500).json({ message: err.message });
  }
};