const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const { uploadFields } = require("../middlewares/upload.middleware");
const userController = require("../controllers/users.controller");

/* ==================== PROFILE ==================== */
router.get("/me", auth, userController.getProfile);
router.put("/me", auth, uploadFields.single("avatar"), userController.updateProfile);

/* ==================== OWNER FEATURES ==================== */
router.get("/mechanics", auth, role("owner"), userController.getMechanics);

module.exports = router;