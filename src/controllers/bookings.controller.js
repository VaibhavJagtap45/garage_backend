
const Booking = require("../models/Booking");
const Service = require("../models/Service");
const Inventory = require("../models/InventoryItem");
// const Booking = require("../models/Booking");
const User = require("../models/User");

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
// exports.myBookings = async (req, res) => {
//   try {
//     const bookings = await Booking.find({ customer: req.user._id })
//       .populate("service")
//       .populate("mechanic", "name phone");

//     res.json(bookings);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };


/* ================= ASSIGN MECHANIC ================= */
exports.assignMechanic = async (req, res) => {
  try {
    const { mechanicId } = req.body;

    const booking = await Booking.findById(req.params.id)
      .populate("service");

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    // ensure owner owns the service
    if (booking.service.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your booking" });

    booking.mechanic = mechanicId;
    booking.status = "assigned";
    booking.assignedAt = new Date();

    await booking.save();

    res.json({ message: "Mechanic assigned", booking });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
/* ================= MY BOOKINGS (AUTO ROLE) ================= */
exports.myBookings = async (req, res) => {
  try {
    let filter = {};

    // customer → own bookings
    if (req.user.role === "customer") {
      filter.customer = req.user._id;
    }

    // owner → bookings for his services
    if (req.user.role === "owner") {
      const services = await Service.find({ owner: req.user._id }).select("_id");
      filter.service = { $in: services.map(s => s._id) };
    }

    const bookings = await Booking.find(filter)
      .populate("service", "title price owner")
      .populate("customer", "name phone")
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

/* ================= COMPLETE BOOKING (OWNER) ================= */
/* ================= COMPLETE BOOKING ================= */
exports.completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate("service");

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    if (booking.service.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your booking" });

    booking.status = "completed";
    booking.completedAt = new Date();

    await booking.save();

    res.json({ message: "Booking completed", booking });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
