const Coupon = require("../models/Coupon");
const CouponUsage = require("../models/CouponUsage");
const Booking = require("../models/Booking");
const Service = require("../models/Service");

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

/* GET AVAILABLE COUPONS (optional filter by owner) */
exports.getAvailableCoupons = async (req, res) => {
  try {
    const today = new Date();
    const filter = {
      isActive: true,
      validFrom: { $lte: today },
      validTill: { $gte: today },
    };
    // If ownerId provided, restrict to that owner
    if (req.query.ownerId) {
      filter.owner = req.query.ownerId;
    }
    const coupons = await Coupon.find(filter);
    res.json(coupons);
  } catch (err) {
    console.error("getAvailableCoupons error:", err);
    res.status(500).json({ message: err.message });
  }
};

/* APPLY COUPON */
exports.applyCoupon = async (req, res) => {
  try {
    const { code, bookingId } = req.body;

    const booking = await Booking.findById(bookingId).populate("service");
    if (!booking) return res.status(404).json({ message: "Booking not found" });

    if (booking.customer.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not your booking" });

    const coupon = await Coupon.findOne({ code: code.toUpperCase(), isActive: true });
    if (!coupon) return res.status(404).json({ message: "Invalid coupon" });

    // Validate dates
    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validTill)
      return res.status(400).json({ message: "Coupon expired or not yet valid" });

    // Owner must match the service owner
    if (coupon.owner.toString() !== booking.service.owner.toString())
      return res.status(400).json({ message: "Coupon not applicable for this garage" });

    // Check usage limit
    if (coupon.usedCount >= coupon.usageLimit)
      return res.status(400).json({ message: "Coupon usage limit reached" });

    // One-time per user
    const existingUsage = await CouponUsage.findOne({ coupon: coupon._id, user: req.user._id });
    if (existingUsage && coupon.oneTimePerUser)
      return res.status(400).json({ message: "You have already used this coupon" });

    // Minimum amount
    if (booking.totalPrice < coupon.minBookingAmount)
      return res.status(400).json({ message: `Minimum order amount is ${coupon.minBookingAmount}` });

    let discount =
      coupon.discountType === "percentage"
        ? (booking.totalPrice * coupon.discountValue) / 100
        : coupon.discountValue;

    if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount);
    if (discount > booking.totalPrice) discount = booking.totalPrice; // prevent negative

    // Update booking
    booking.discount = discount;
    booking.finalPrice = booking.totalPrice - discount;
    booking.coupon = coupon._id;
    await booking.save();

    // Record usage and increment coupon count
    await CouponUsage.create({ coupon: coupon._id, user: req.user._id, booking: booking._id });
    coupon.usedCount += 1;
    await coupon.save();

    res.json({ discount, finalPrice: booking.finalPrice });
  } catch (err) {
    console.error("applyCoupon error:", err);
    res.status(500).json({ message: err.message });
  }
};