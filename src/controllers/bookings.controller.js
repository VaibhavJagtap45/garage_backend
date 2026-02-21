// // const Booking = require("../models/Booking");
// // const Service = require("../models/Service");

// // // CREATE BOOKING
// // exports.createBooking = async (req, res) => {
// //   try {
// //     const { serviceId, scheduledDate, notes } = req.body;

// //     const service = await Service.findById(serviceId);
// //     if (!service)
// //       return res.status(404).json({ message: "Service not found" });

// //     const booking = await Booking.create({
// //       customer: req.user.id,
// //       service: serviceId,
// //       scheduledDate,
// //       totalPrice: service.price,
// //       notes,
// //     });

// //     res.json(booking);
// //   } catch (err) {
// //     res.status(500).json(err);
// //   }
// // };

// // // MY BOOKINGS
// // exports.myBookings = async (req, res) => {
// //   try {
// //     const bookings = await Booking.find({ customer: req.user.id })
// //       .populate("service")
// //       .populate("mechanic", "name phone");

// //     res.json(bookings);
// //   } catch (err) {
// //     res.status(500).json(err);
// //   }
// // };

// // exports.ownerBookings = async (req, res) => {
// //   try {
// //     const bookings = await Booking.find()
// //       .populate({
// //         path: "service",
// //         match: { owner: req.user.id }
// //       })
// //       .populate("customer", "name phone")
// //       .populate("mechanic", "name phone");

// //     const filtered = bookings.filter(b => b.service !== null);

// //     res.json(filtered);
// //   } catch (err) {
// //     res.status(500).json(err);
// //   }
// // };
// // // RESCHEDULE BOOKING
// // exports.rescheduleBooking = async (req, res) => {
// //   try {
// //     const { bookingId } = req.params;
// //     const { newDate } = req.body;

// //     const booking = await Booking.findById(bookingId);

// //     if (!booking)
// //       return res.status(404).json({ message: "Booking not found" });

// //     // owner check
// //     if (booking.customer.toString() !== req.user.id)
// //       return res.status(403).json({ message: "Unauthorized" });

// //     // cannot reschedule completed/cancelled
// //     if (["completed", "cancelled"].includes(booking.status))
// //       return res
// //         .status(400)
// //         .json({ message: "This booking cannot be rescheduled" });

// //     // prevent past date
// //     if (new Date(newDate) < new Date())
// //       return res.status(400).json({ message: "Invalid date" });

// //     booking.scheduledDate = newDate;
// //     booking.status = "pending";

// //     await booking.save();

// //     res.json({
// //       message: "Booking rescheduled successfully",
// //       booking,
// //     });
// //   } catch (err) {
// //     res.status(500).json(err);
// //   }
// // };






// // bookings.controller.js
// const mongoose = require("mongoose");
// const Booking = require("../models/Booking");
// const Service = require("../models/Service");
// const Inventory = require("../models/InventoryItem");

// /**
//  * Create booking (customer) - prevents past bookings and overlapping slots
//  */
// exports.createBooking = async (req, res) => {
//   try {
//     const { serviceId, scheduledDate, notes } = req.body;

//     const service = await Service.findById(serviceId);
//     if (!service) return res.status(404).json({ message: "Service not found" });

//     const date = new Date(scheduledDate);
//     if (isNaN(date.getTime()) || date <= new Date()) {
//       return res.status(400).json({ message: "Invalid or past date" });
//     }

//     // Prevent overlapping bookings for same service within +/- 1 hour
//     const existing = await Booking.findOne({
//       service: serviceId,
//       scheduledDate: {
//         $gte: new Date(date.getTime() - 60 * 60 * 1000),
//         $lte: new Date(date.getTime() + 60 * 60 * 1000),
//       },
//       status: { $in: ["pending", "assigned", "accepted", "in_progress"] },
//     });

//     if (existing) return res.status(400).json({ message: "Time slot already booked" });

//     // const booking = await Booking.create({
//     //   customer: req.user._id,
//     //   service: serviceId,
//     //   scheduledDate: date,
//     //   totalPrice: service.price,
//     //   notes,
//     //   status: "pending",
//     //   rescheduledCount: 0,
//     // });

//     const booking = await Booking.create({
//   customer: req.user._id,
//   service: serviceId,
//   scheduledDate: date,
//   totalPrice: service.price,
//   finalPrice: service.price,
//   notes,
//   status: "pending",
// });

//     res.status(201).json(booking);
//   } catch (err) {
//     console.error("createBooking error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// /**
//  * My bookings (customer)
//  */
// exports.myBookings = async (req, res) => {
//   try {
//     const bookings = await Booking.find({ customer: req.user._id })
//       .populate("service")
//       .populate("mechanic", "name phone");

//     res.json(bookings);
//   } catch (err) {
//     console.error("myBookings error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// /**
//  * Owner bookings (bookings for services owned by this owner)
//  */
// exports.ownerBookings = async (req, res) => {
//   try {
//     // find bookings where service.owner == req.user._id
//     const bookings = await Booking.find()
//       .populate({ path: "service", select: "title owner price" })
//       .populate("customer", "name phone")
//       .populate("mechanic", "name phone");

//     const filtered = bookings.filter((b) => b.service && b.service.owner.toString() === req.user._id.toString());
//     res.json(filtered);
//   } catch (err) {
//     console.error("ownerBookings error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// /**
//  * Reschedule booking (customer) - clears mechanic/parts and resets to pending
//  */
// exports.rescheduleBooking = async (req, res) => {
//   try {
//     const { bookingId } = req.params;
//     const { newDate } = req.body;

//     const booking = await Booking.findById(bookingId);
//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     // owner check (customer must be owner of booking)
//     if (booking.customer.toString() !== req.user._id.toString())
//       return res.status(403).json({ message: "Unauthorized" });

//     if (["completed", "cancelled"].includes(booking.status))
//       return res.status(400).json({ message: "This booking cannot be rescheduled" });

//     const date = new Date(newDate);
//     if (isNaN(date.getTime()) || date <= new Date())
//       return res.status(400).json({ message: "Invalid date" });

//     // max reschedule limit
//     booking.rescheduledCount = (booking.rescheduledCount || 0) + 1;
//     if (booking.rescheduledCount > 3)
//       return res.status(400).json({ message: "Max reschedule limit reached" });

//     // clear assigned mechanic/parts and reset lifecycle
//     booking.scheduledDate = date;
//     booking.status = "pending";
//     booking.mechanic = null;
//     booking.assignedAt = null;
//     booking.startedAt = null;
//     booking.completedAt = null;
//     booking.parts = []; // parts must be re-assigned/reserved when owner assigns

//     await booking.save();

//     res.json({ message: "Booking rescheduled", booking });
//   } catch (err) {
//     console.error("rescheduleBooking error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };


// /**
//  * Cancel booking (customer)
//  */
// exports.cancelBooking = async (req, res) => {
//   try {
//     const { bookingId } = req.params;

//     const booking = await Booking.findById(bookingId);
//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     // only booking owner can cancel
//     if (booking.customer.toString() !== req.user._id.toString())
//       return res.status(403).json({ message: "Unauthorized" });

//     // cannot cancel after work started
//     if (["in_progress", "completed"].includes(booking.status))
//       return res.status(400).json({ message: "Booking cannot be cancelled now" });

//     // release reserved parts
//     // if (booking.parts && booking.parts.length > 0) {
//     //   for (const p of booking.parts) {
//     //     await Inventory.findByIdAndUpdate(p.itemId, {
//     //       $inc: { reservedQty: -p.qty },
//     //     });
//     //   }
//     // }
// // RELEASE RESERVED PARTS
// if (booking.parts && booking.parts.length > 0) {
//   for (const p of booking.parts) {
//     await Inventory.findByIdAndUpdate(p.itemId, {
//       $inc: { reservedQty: -p.qty },
//     });
//   }
// }
// booking.parts = [];
//     // reset booking
//     booking.status = "cancelled";
//     booking.mechanic = null;
//     booking.parts = [];
//     booking.assignedAt = null;
//     booking.startedAt = null;
//     booking.completedAt = null;

//     await booking.save();

//     res.json({
//       message: "Booking cancelled successfully",
//       booking,
//     });
//   } catch (err) {
//     console.error("cancelBooking error:", err);
//     res.status(500).json({ message: "Server error", error: err.message });
//   }
// };





const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Inventory = require("../models/InventoryItem");

/* ================= CREATE BOOKING ================= */
exports.createBooking = async (req, res) => {
  try {
    const { serviceId, scheduledDate, notes } = req.body;

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const date = new Date(scheduledDate);
    if (isNaN(date.getTime()) || date <= new Date())
      return res.status(400).json({ message: "Invalid or past date" });

    // Prevent overlapping booking
    const clash = await Booking.findOne({
      service: serviceId,
      scheduledDate: {
        $gte: new Date(date.getTime() - 60 * 60 * 1000),
        $lte: new Date(date.getTime() + 60 * 60 * 1000),
      },
      status: { $in: ["pending", "assigned", "in_progress"] },
    });

    if (clash)
      return res.status(400).json({ message: "Time slot already booked" });

    const booking = await Booking.create({
      customer: req.user._id,
      service: serviceId,
      scheduledDate: date,
      totalPrice: service.price,
      finalPrice: service.price,
      notes,
    });

    res.status(201).json(booking);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= CUSTOMER BOOKINGS ================= */
exports.myBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate("service")
      .populate("mechanic", "name phone");

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= OWNER BOOKINGS ================= */
exports.ownerBookings = async (req, res) => {
  try {
    const bookings = await Booking.find()
      .populate({ path: "service", select: "title owner price" })
      .populate("customer", "name phone")
      .populate("mechanic", "name phone");

    const filtered = bookings.filter(
      (b) => b.service && b.service.owner.toString() === req.user._id.toString()
    );

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= RESCHEDULE ================= */
exports.rescheduleBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.customer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    if (["completed", "cancelled"].includes(booking.status))
      return res.status(400).json({ message: "Cannot reschedule" });

    const newDate = new Date(req.body.newDate);
    if (newDate <= new Date())
      return res.status(400).json({ message: "Invalid date" });

    // release reserved parts
    for (const p of booking.parts) {
      await Inventory.findByIdAndUpdate(p.itemId, {
        $inc: { reservedQty: -p.qty },
      });
    }

    booking.parts = [];
    booking.mechanic = null;
    booking.status = "pending";
    booking.scheduledDate = newDate;
    booking.assignedAt = null;
    booking.startedAt = null;
    booking.completedAt = null;

    await booking.save();

    res.json({ message: "Booking rescheduled", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ================= CANCEL BOOKING ================= */
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.customer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    if (booking.status === "completed")
      return res.status(400).json({ message: "Already completed" });

    // release inventory
    for (const p of booking.parts) {
      await Inventory.findByIdAndUpdate(p.itemId, {
        $inc: { reservedQty: -p.qty },
      });
    }

    booking.parts = [];
    booking.mechanic = null;
    booking.status = "cancelled";
    booking.paymentStatus = "pending";
    booking.paidAt = null;

    await booking.save();

    res.json({ message: "Booking cancelled", booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};