// const router = require("express").Router();
// const auth = require("../middlewares/auth.middleware");

// const {
//   createBooking,
//   myBookings,
//   rescheduleBooking,
// } = require("../controllers/bookings.controller");

// // create booking (customer)
// router.post("/", auth, createBooking);

// // get my bookings
// router.get("/my", auth, myBookings);

// // reschedule booking
// router.put("/reschedule/:bookingId", auth, rescheduleBooking);

// module.exports = router;









// bookings.routes.js
const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const {
  createBooking,
  myBookings,
  rescheduleBooking,
  ownerBookings,
  cancelBooking,
} = require("../controllers/bookings.controller");

// create booking (customer)
router.post("/", auth, createBooking);

// get my bookings
// router.get("/my", auth, myBookings);
router.get("/:id", auth, myBookings);

// owner bookings (owner dashboard)
router.get("/owner", auth, role("owner"), ownerBookings);

// reschedule booking (customer)
router.put("/reschedule/:bookingId", auth, rescheduleBooking);
// cancel booking (customer)
router.put("/cancel/:bookingId", auth, cancelBooking);
module.exports = router;