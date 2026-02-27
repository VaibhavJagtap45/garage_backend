const Booking = require("../models/Booking");
const FakeTransaction = require("../models/FakeTransaction");
const Service = require("../models/Service");

exports.payBooking = async (req, res) => {
  try {
    const { bookingId, method } = req.body;

    const booking = await Booking.findById(bookingId).populate("service");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    // Only customer can pay
    if (booking.customer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    if (booking.paymentStatus === "paid")
      return res.status(400).json({ message: "Already paid" });

    const service = await Service.findById(booking.service); // already populated, but safe
    const ownerId = service.owner;

    const amount = booking.finalPrice || booking.totalPrice;

    // Create transaction with owner
    const transaction = await FakeTransaction.create({
      booking: booking._id,
      user: req.user._id,
      owner: ownerId,
      amount,
      transactionId: "TXN_" + Date.now(),
      method: method || "UPI",
    });

    booking.paymentStatus = "paid";
    booking.paidAt = new Date();
    await booking.save();

    res.json({
      message: "Payment successful",
      transaction,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Payment failed" });
  }
};