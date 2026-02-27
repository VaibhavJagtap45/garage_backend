const express = require("express");
const router = express.Router();

const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
// ❌ Removed unused uploadForm import

const {
  addMechanic,
  getMechanics,
  updateMechanic,
  deleteMechanic,
  assignMechanic,
  unassignMechanic,
  startJob,
  completeJob,
  getMechanicByBooking,
  getMyAssignments,
  mechanicStartJob,
  mechanicCompleteJob,
  getMyHistory,
  // ❌ Removed getMyJobs import
} = require("../controllers/mechanics.controller");

/* ----------------- OWNER (full control) ----------------- */
router.post("/", auth, role("owner"), addMechanic);
router.get("/", auth, role("owner"), getMechanics);
router.put("/:id", auth, role("owner"), updateMechanic);
router.delete("/:id", auth, role("owner"), deleteMechanic);
router.put("/assign/:bookingId", auth, role("owner"), assignMechanic);
router.put("/unassign/:bookingId", auth, role("owner"), unassignMechanic);
router.put("/start/:bookingId", auth, role("owner"), startJob);
router.put("/complete/:bookingId", auth, role("owner"), completeJob);

/* ----------------- MECHANIC SELF ----------------- */
router.get("/me/assignments", auth, role("mechanic"), getMyAssignments);
router.put("/me/start/:bookingId", auth, role("mechanic"), mechanicStartJob);
router.put("/me/complete/:bookingId", auth, role("mechanic"), mechanicCompleteJob);
router.get("/me/history", auth, role("mechanic"), getMyHistory);
/* ----------------- CUSTOMER / PUBLIC ----------------- */
router.get("/by-booking/:bookingId", auth, getMechanicByBooking);

module.exports = router;