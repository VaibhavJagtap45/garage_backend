// inventory.routes.js
const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const {uploadFields} = require("../middlewares/upload.middleware");
const controller = require("../controllers/inventory.controller");

router.post("/", auth, role("owner"), uploadFields.single("image"), controller.addItem);
router.get("/", auth, role("owner"), controller.getItems); // owner items
router.get("/low-stock", auth, role("owner"), controller.lowStock);
router.get("/public/:id", controller.getItem); // public single item

router.put("/:id", auth, role("owner"), uploadFields.single("image"), controller.updateItem);
router.delete("/:id", auth, role("owner"), controller.deleteItem);

router.post("/:id/restock", auth, role("owner"), controller.restock);

// reserve/unreserve endpoints (owner)
router.post("/reserve", auth, role("owner"), controller.reserveForBooking);
router.post("/unreserve", auth, role("owner"), controller.unreserve);

module.exports = router;