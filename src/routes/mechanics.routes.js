const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const {
  addMechanic,
  getMechanics,
  updateMechanic,
  deleteMechanic,
  assignMechanic,
  startJob,
  completeJob,
} = require("../controllers/mechanics.controller");

/* ---------- OWNER ONLY ---------- */

// add mechanic
router.post("/", auth, role("owner"), addMechanic);

// list mechanics (owner dashboard)
router.get("/", auth, role("owner"), getMechanics);

// update mechanic
router.put("/:id", auth, role("owner"), updateMechanic);

// delete mechanic
router.delete("/:id", auth, role("owner"), deleteMechanic);

// assign mechanic to booking
router.put("/assign/:bookingId", auth, role("owner"), assignMechanic);

// owner controls job progress
router.put("/start/:bookingId", auth, role("owner"), startJob);
router.put("/complete/:bookingId", auth, role("owner"), completeJob);

/* ---------- CUSTOMER VIEW ---------- */
router.get("/public", auth, getMechanics);


module.exports = router;