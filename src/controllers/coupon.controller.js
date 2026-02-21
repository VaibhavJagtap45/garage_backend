// const Coupon = require("../models/Coupon");
// const CouponUsage = require("../models/CouponUsage");
// const Booking = require("../models/Booking");

// /* OWNER CREATE COUPON */
// exports.createCoupon = async (req, res) => {
//   try {
//     const coupon = await Coupon.create({
//       ...req.body,
//       owner: req.user._id,
//       code: req.body.code.toUpperCase(),
//     });

//     res.status(201).json(coupon);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// /* CUSTOMER VIEW AVAILABLE COUPONS */
// exports.getAvailableCoupons = async (req, res) => {
//   try {
//     const today = new Date();

//     const coupons = await Coupon.find({
//       isActive: true,
//       validFrom: { $lte: today },
//       validTill: { $gte: today },
//     });

//     res.json(coupons);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// /* APPLY COUPON */
// exports.applyCoupon = async (req, res) => {
//   try {
//     const { code, bookingId } = req.body;

//     const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
//     if (!coupon) return res.status(404).json({ message: "Invalid coupon" });

//     const booking = await Booking.findById(bookingId);
//     if (!booking) return res.status(404).json({ message: "Booking not found" });

//     if (booking.totalPrice < coupon.minBookingAmount)
//       return res.status(400).json({ message: "Minimum booking amount not reached" });

//     // one-time per user
//     if (coupon.oneTimePerUser) {
//       const used = await CouponUsage.findOne({
//         coupon: coupon._id,
//         user: req.user._id,
//       });
//       if (used) return res.status(400).json({ message: "Coupon already used" });
//     }

//     // usage limit
//     if (coupon.usedCount >= coupon.usageLimit)
//       return res.status(400).json({ message: "Coupon exhausted" });

//     // calculate discount
//     let discount = 0;

//     if (coupon.discountType === "percentage") {
//       discount = (booking.totalPrice * coupon.discountValue) / 100;
//       if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
//     } else {
//       discount = coupon.discountValue;
//     }

//     const finalAmount = booking.totalPrice - discount;

//     res.json({
//       coupon: coupon.code,
//       discount,
//       finalAmount,
//     });
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
















const Coupon = require("../models/Coupon");
const CouponUsage = require("../models/CouponUsage");
const Booking = require("../models/Booking");

/* CREATE COUPON (OWNER) */
exports.createCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.create({
      ...req.body,
      owner: req.user._id,
      code: req.body.code.toUpperCase(),
    });

    res.status(201).json(coupon);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* GET AVAILABLE COUPONS */
exports.getAvailableCoupons = async (req, res) => {
  const today = new Date();

  const coupons = await Coupon.find({
    isActive: true,
    validFrom: { $lte: today },
    validTill: { $gte: today },
  });

  res.json(coupons);
};

/* APPLY COUPON */
exports.applyCoupon = async (req, res) => {
  try {
    const { code, bookingId } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.customer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your booking" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ message: "Invalid coupon" });

    // one-time use
    const used = await CouponUsage.findOne({ coupon: coupon._id, user: req.user._id });
    if (used && coupon.oneTimePerUser)
      return res.status(400).json({ message: "Coupon already used" });

    if (booking.totalPrice < coupon.minBookingAmount)
      return res.status(400).json({ message: "Minimum amount not met" });

    let discount =
      coupon.discountType === "percentage"
        ? (booking.totalPrice * coupon.discountValue) / 100
        : coupon.discountValue;

    if (coupon.maxDiscount)
      discount = Math.min(discount, coupon.maxDiscount);

    booking.discount = discount;
    booking.finalPrice = booking.totalPrice - discount;
    booking.coupon = coupon._id;

    await booking.save();

    res.json({ discount, finalPrice: booking.finalPrice });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};