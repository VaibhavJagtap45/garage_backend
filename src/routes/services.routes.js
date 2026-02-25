 router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const {uploadFields} = require("../middlewares/upload.middleware");

const {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  getMyServices,   // ⭐ IMPORTANT (you forgot this)
} = require("../controllers/services.controller");

/* ---------------- OWNER PERSONAL SERVICES ---------------- */
/* MUST COME BEFORE :id */
router.get("/my", auth, role("owner"), getMyServices);

/* ---------------- PUBLIC ---------------- */
router.get("/", getServices);

/* ---------------- SINGLE SERVICE ---------------- */
/* keep AFTER /my */
router.get("/:id", getService);

/* ---------------- OWNER CRUD ---------------- */
router.post("/", auth, role("owner"), uploadFields.single("image"), createService);
router.put("/:id", auth, role("owner"), uploadFields.single("image"), updateService);
router.delete("/:id", auth, role("owner"), deleteService);

module.exports = router;