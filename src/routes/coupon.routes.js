const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const {
  createCoupon,
  getAvailableCoupons,
  applyCoupon,
} = require("../controllers/coupon.controller");

/* OWNER */
router.post("/", auth, role("owner"), createCoupon);

/* CUSTOMER */
router.get("/", auth, getAvailableCoupons);
// router.post("/apply", auth, applyCoupon);
router.post("/apply", auth, role("customer"), applyCoupon);
module.exports = router;