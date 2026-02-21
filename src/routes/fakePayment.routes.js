console.log("🔥 fakePayment.routes.js EXECUTED");


const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");

const { payBooking } = require("../controllers/fakePayment.controller");

router.post("/pay", auth, role("customer"), payBooking);

module.exports = router;