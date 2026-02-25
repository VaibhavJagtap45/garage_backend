const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const {
  createBooking,
  myBookings,
  ownerBookings,
  acceptBooking,
  rejectBooking,
  cancelBooking,
  completeBooking,
} = require("../controllers/bookings.controller");

/* ================= CUSTOMER ================= */

// create booking
router.post("/", auth, createBooking);

// customer bookings
router.get("/my", auth, myBookings);

// cancel booking
router.put("/:bookingId/cancel", auth, cancelBooking);

/* ================= OWNER ================= */

// owner dashboard bookings
router.get("/owner", auth, role("owner"), ownerBookings);

// accept booking
router.put("/accept/:bookingId", auth, role("owner"), acceptBooking);

// reject booking
router.put("/reject/:bookingId", auth, role("owner"), rejectBooking);

// (optional) manual complete booking
router.put("/complete/:bookingId", auth, role("owner"), completeBooking);

router.put("/:bookingId/pay", auth, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);

    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.customer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your booking" });

    if (booking.paymentStatus === "paid")
      return res.status(400).json({ message: "Already paid" });

    booking.paymentStatus = "paid";
    await booking.save();

    res.json({ message: "Payment successful" });
  } catch (err) {
    console.error("payBooking:", err);
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;