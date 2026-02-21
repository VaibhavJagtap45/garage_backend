// const router = require("express").Router();
// const auth = require("../middlewares/auth.middleware");
// const role = require("../middlewares/role.middleware");
// const upload = require("../middlewares/upload.middleware");

// const {
//   createService,
//   getServices,
//   getService,
// } = require("../controllers/services.controller");

// // public
// router.get("/", getServices);
// router.get("/:id", getService);

// // owner only
// router.post("/", auth, role("owner"), upload.single("image"), createService);

// module.exports = router;










const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const upload = require("../middlewares/upload.middleware");

const {
  createService,
  getServices,
  getService,
  updateService,
  deleteService,
} = require("../controllers/services.controller");

// PUBLIC
router.get("/", getServices);
router.get("/:id", getService);

// OWNER ONLY
router.post("/", auth, role("owner"), upload.single("image"), createService);
router.put("/:id", auth, role("owner"), upload.single("image"), updateService);
router.delete("/:id", auth, role("owner"), deleteService);

module.exports = router;