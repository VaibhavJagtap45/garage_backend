const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

// ✅ Import Booking model (used in removed inline route, but keep if needed elsewhere)
// const Booking = require("../models/Booking");

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
router.post("/", auth, createBooking);
router.get("/my", auth, myBookings);
router.put("/:bookingId/cancel", auth, cancelBooking);

/* ================= OWNER ================= */
router.get("/owner", auth, role("owner"), ownerBookings);
router.put("/accept/:bookingId", auth, role("owner"), acceptBooking);
router.put("/reject/:bookingId", auth, role("owner"), rejectBooking);
router.put("/complete/:bookingId", auth, role("owner"), completeBooking);

// ❌ Removed inline payment route – use fakePayment.routes.js instead

module.exports = router;