const FakeTransaction = require("../models/FakeTransaction");

exports.ownerTransactions = async (req, res) => {
  try {
    const transactions = await FakeTransaction.find({ owner: req.user._id })
      .populate("user", "name email")
      .populate({
        path: "booking",
        populate: { path: "service", select: "title price" },
      })
      .sort({ createdAt: -1 });

    res.json(transactions);
  } catch (err) {
    console.error("ownerTransactions error:", err);
    res.status(500).json({ message: err.message });
  }
};