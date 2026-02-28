console.log("🔥 fakePayment.routes.js EXECUTED");

const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const { payBooking } = require("../controllers/fakePayment.controller");

router.post("/pay", (req, res) => {
  res.json({ message: "Fake payment success" });
});
module.exports = router;