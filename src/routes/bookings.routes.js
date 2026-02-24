const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const {
  createBooking,
  myBookings,
  ownerBookings,
  cancelBooking,
  assignMechanic,
  completeBooking,
} = require("../controllers/bookings.controller");

/* CUSTOMER creates booking */
router.post("/", auth, createBooking);

/* CUSTOMER bookings */
router.get("/my", auth, myBookings);

/* OWNER bookings (service requests panel) */
router.get("/owner", auth, role("owner"), ownerBookings);

/* OWNER marks completed */
// router.put("/:bookingId/complete", auth, role("owner"), completeBooking);

/* CUSTOMER cancels */
router.put("/:bookingId/cancel", auth, cancelBooking);
// const {
//   ,
//   completeBooking
// } = require("../controllers/bookings.controller");

router.put("/:id/assign", auth, role("owner"), assignMechanic);
router.put("/:id/complete", auth, role("owner"), completeBooking);
module.exports = router;