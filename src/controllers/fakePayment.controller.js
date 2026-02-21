// const Booking = require("../models/Booking");
// const FakeTransaction = require("../models/FakeTransaction");

// /* SIMULATED PAYMENT */
// exports.payBooking = async (req, res) => {
//   try {
//     const { bookingId, method } = req.body;

//     const booking = await Booking.findById(bookingId);

//     if (!booking)
//       return res.status(404).json({ message: "Booking not found" });

//     if (booking.paymentStatus === "paid")
//       return res.status(400).json({ message: "Already paid" });

//     // create fake transaction id
//     const txnId = "TXN" + Date.now();

//     const amount = booking.finalPrice || booking.totalPrice;

//     // save transaction
//     const transaction = await FakeTransaction.create({
//       booking: booking._id,
//       user: req.user._id,
//       amount,
//       transactionId: txnId,
//       method: method || "UPI",
//       status: "success",
//     });

//     // mark booking paid
//     booking.paymentStatus = "paid";
//     booking.paidAt = new Date();
//     await booking.save();

//     res.json({
//       message: "Payment successful",
//       transaction,
//       bookingId: booking._id,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };





// const Booking = require("../models/Booking");
// const FakeTransaction = require("../models/FakeTransaction");

// exports.payBooking = async (req, res) => {
//   try {
//     const { bookingId, method } = req.body;

//     const booking = await Booking.findById(bookingId);

//     if (!booking)
//       return res.status(404).json({ message: "Booking not found" });

//     // OWNER CHECK
//     if (booking.customer.toString() !== req.user._id.toString())
//       return res.status(403).json({ message: "You cannot pay this booking" });

//     if (booking.paymentStatus === "paid")
//       return res.status(400).json({ message: "Already paid" });

//     const txnId = "TXN" + Date.now();
//     const amount = booking.finalPrice || booking.totalPrice;

//     const transaction = await FakeTransaction.create({
//       booking: booking._id,
//       user: req.user._id,
//       amount,
//       transactionId: txnId,
//       method: method || "UPI",
//       status: "success",
//     });

//     booking.paymentStatus = "paid";
//     booking.paidAt = new Date();

//     await booking.save();

//     res.json({
//       message: "Payment successful",
//       transaction,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };






const Booking = require("../models/Booking");
const FakeTransaction = require("../models/FakeTransaction");
const Service = require("../models/Service");

exports.payBooking = async (req, res) => {
  try {
    const { bookingId, method } = req.body;

    const booking = await Booking.findById(bookingId).populate("service");

    if (!booking)
      return res.status(404).json({ message: "Booking not found" });

    // only customer can pay
    if (booking.customer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Unauthorized" });

    if (booking.paymentStatus === "paid")
      return res.status(400).json({ message: "Already paid" });

    const service = await Service.findById(booking.service);
    const ownerId = service.owner;

    const amount = booking.finalPrice || booking.totalPrice;

    // ⭐ CREATE TRANSACTION WITH OWNER
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