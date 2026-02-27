const Booking = require("../models/Booking");
const Service = require("../models/Service");

/* ==========================================
   CREATE BOOKING (CUSTOMER)
========================================== */
exports.createBooking = async (req, res) => {
  try {
    const { serviceId, scheduledDate, address } = req.body;

    // Get service to fetch price
    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    const booking = await Booking.create({
      customer: req.user._id,
      service: serviceId,
      scheduledDate,
      address, // now stored
      totalPrice: service.price, // ✅ set price
      status: "pending",
    });

    res.status(201).json(booking);
  } catch (err) {
    console.error("createBooking:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ==========================================
   CUSTOMER BOOKINGS
========================================== */
exports.myBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ customer: req.user._id })
      .populate("service")
      .populate("mechanic")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("myBookings:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ==========================================
   OWNER BOOKINGS (all bookings for owner's services)
========================================== */
exports.ownerBookings = async (req, res) => {
  try {
    const services = await Service.find({ owner: req.user._id }).select("_id");
    const serviceIds = services.map((s) => s._id);

    const bookings = await Booking.find({ service: { $in: serviceIds } })
      .populate("service", "title")
      .populate("customer", "name phone")
      .populate("mechanic", "name phone")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (err) {
    console.error("ownerBookings:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ==========================================
   ACCEPT BOOKING (OWNER)
========================================== */
exports.acceptBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate("service");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.service.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your booking" });

    booking.status = "accepted";
    await booking.save();

    res.json({ message: "Booking accepted", booking });
  } catch (err) {
    console.error("acceptBooking:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ==========================================
   REJECT BOOKING (OWNER)
========================================== */
exports.rejectBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate("service");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.service.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your booking" });

    booking.status = "rejected";
    await booking.save();

    res.json({ message: "Booking rejected", booking });
  } catch (err) {
    console.error("rejectBooking:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ==========================================
   CUSTOMER CANCEL BOOKING
========================================== */
exports.cancelBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.customer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your booking" });

    // Cannot cancel after assigned/in_progress
    if (["assigned", "in_progress", "completed"].includes(booking.status)) {
      return res.status(400).json({
        message: "Service already scheduled. Contact garage to cancel.",
      });
    }

    booking.status = "cancelled";
    await booking.save();

    res.json({ message: "Booking cancelled successfully" });
  } catch (err) {
    console.error("cancelBooking:", err);
    res.status(500).json({ message: err.message });
  }
};

/* ==========================================
   COMPLETE BOOKING (OWNER OPTIONAL)
========================================== */
exports.completeBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate("service");

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.service.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your booking" });

    booking.status = "completed";
    await booking.save();

    res.json({ message: "Booking completed", booking });
  } catch (err) {
    console.error("completeBooking:", err);
    res.status(500).json({ message: err.message });
  }
};