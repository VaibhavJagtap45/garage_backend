const router = require("express").Router(); // ✅ Added missing const
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const { uploadFields } = require("../middlewares/upload.middleware");

const {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
  getMyServices,
} = require("../controllers/services.controller");

/* ---------------- OWNER PERSONAL SERVICES ---------------- */
router.get("/my", auth, role("owner"), getMyServices);

/* ---------------- PUBLIC ---------------- */
router.get("/", getServices);

/* ---------------- SINGLE SERVICE ---------------- */
router.get("/:id", getService);

/* ---------------- OWNER CRUD ---------------- */
router.post("/", auth, role("owner"), uploadFields.single("image"), createService);
router.put("/:id", auth, role("owner"), uploadFields.single("image"), updateService);
router.delete("/:id", auth, role("owner"), deleteService);

module.exports = router;