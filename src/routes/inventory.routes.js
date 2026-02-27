const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const { uploadFields } = require("../middlewares/upload.middleware");
const controller = require("../controllers/inventory.controller");

/* ================= OWNER ROUTES ================= */
router.post("/", auth, role("owner"), uploadFields.single("image"), controller.addItem);
router.get("/", auth, role("owner"), controller.getItems);
router.get("/low-stock", auth, role("owner"), controller.lowStock);
router.get("/public/:id", controller.getItem);
router.put("/:id", auth, role("owner"), uploadFields.single("image"), controller.updateItem);
router.delete("/:id", auth, role("owner"), controller.deleteItem);
router.post("/:id/restock", auth, role("owner"), controller.restock);
router.post("/reserve", auth, role("owner"), controller.reserveForBooking);
router.post("/unreserve", auth, role("owner"), controller.unreserve);

/* ================= MECHANIC ROUTE ================= */
router.get("/me", auth, role("mechanic"), controller.getGarageInventoryForMechanic);

module.exports = router;