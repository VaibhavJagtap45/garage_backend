// routes/mechanics.routes.js
const express = require("express");
const router = express.Router();

/* FORCE JSON PARSE FOR THIS ROUTE */
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
// const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const {uploadForm} = require("../middlewares/upload.middleware");

// router.post("/", auth, role("owner"), uploadForm.none(), addMechanic);
const {
  addMechanic,          // POST   /api/mechanics
  getMechanics,         // GET    /api/mechanics    (owner list)
  updateMechanic,       // PUT    /api/mechanics/:id
  deleteMechanic,       // DELETE /api/mechanics/:id
  assignMechanic,       // PUT    /api/mechanics/assign/:bookingId
  unassignMechanic,     // PUT    /api/mechanics/unassign/:bookingId
  startJob,             // PUT    /api/mechanics/start/:bookingId
  completeJob,          // PUT    /api/mechanics/complete/:bookingId
  getMechanicByBooking, // GET    /api/mechanics/by-booking/:bookingId
} = require("../controllers/mechanics.controller");

/* ----------------- OWNER (full control) ----------------- */

// Add a mechanic (owner only)
router.post("/", auth, role("owner"),  addMechanic);

// List mechanics for owner dashboard (owner only)
router.get("/", auth, role("owner"), getMechanics);

// Update mechanic (owner only)
// router.put("/:id", auth, role("owner"), updateMechanic);
router.put("/:id", auth, role("owner"), updateMechanic);
// Delete mechanic (owner only)
router.delete("/:id", auth, role("owner"),  deleteMechanic);

// Assign mechanic to a booking (owner only)
router.put("/assign/:bookingId", auth, role("owner"),  assignMechanic);
router.put("/unassign/:bookingId", auth, role("owner"),  unassignMechanic);
router.put("/start/:bookingId", auth, role("owner"),  startJob);
// Owner completes job (deduct inventory, mark completed)
router.put("/complete/:bookingId", auth, role("owner"),  completeJob);

/* ----------------- CUSTOMER / PUBLIC VIEWS ----------------- */

// Customer or other authenticated callers: get mechanic assigned to a booking
// (this returns mechanic only if booking has an assigned mechanic)
router.get("/by-booking/:bookingId", auth, getMechanicByBooking);

// Public list endpoint (authenticated). If you want truly public (no auth) remove auth.
router.get("/public", auth, getMechanics);

module.exports = router;