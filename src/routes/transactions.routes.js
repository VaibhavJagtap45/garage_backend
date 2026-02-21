const router = require("express").Router();
const auth = require("../middlewares/auth.middleware");
const role = require("../middlewares/role.middleware");
const { ownerTransactions } = require("../controllers/transactions.controller");

router.get("/", auth, role("owner"), ownerTransactions);

module.exports = router;