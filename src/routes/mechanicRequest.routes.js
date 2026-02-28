const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const {
  listGarages,
  applyToGarage,
  getMyRequests,
  getPendingRequestsForOwner,
  approveRequest,
  rejectRequest
} = require("../controllers/mechanics.controller"); // or "../controllers/mechanicRequest.controller"

// Mechanic: view all garages
router.get("/garages", auth, role("mechanic"), listGarages);

// Mechanic: apply to a garage
router.post("/apply", auth, role("mechanic"), applyToGarage);

// Mechanic: view their own requests
router.get("/my-requests", auth, role("mechanic"), getMyRequests);

// Owner: view pending requests
router.get("/owner/pending", auth, role("owner"), getPendingRequestsForOwner);

// Owner: approve a request
router.put("/:requestId/approve", auth, role("owner"), approveRequest);

// Owner: reject a request
router.put("/:requestId/reject", auth, role("owner"), rejectRequest);

module.exports = router;