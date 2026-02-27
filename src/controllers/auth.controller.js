const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Mechanic = require("../models/Mechanic");

/* ================= REGISTER ================= */
exports.register = async (req, res) => {
  try {
    let { name, email, password, role, phone } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ message: "Missing required fields" });

    email = email.trim().toLowerCase();

    // Normalize phone: remove all non-digits
    if (phone) phone = phone.replace(/\D/g, "");

    // Check duplicate email
    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "Email already registered" });

    const hashed = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password: hashed,
      role: role || "customer",
      phone,
    });

    // Auto-link mechanic if role is mechanic and phone exists
    if (user.role === "mechanic" && phone) {
      // Find mechanic with exact normalized phone
      const mechanic = await Mechanic.findOne({ phone: phone });
      if (mechanic) {
        mechanic.user = user._id;
        mechanic.isAvailable = true;
        await mechanic.save();
        console.log("✅ Mechanic auto-linked:", mechanic.name);
      } else {
        console.log("⚠ Mechanic registered but no owner profile exists yet");
      }
    }

    res.status(201).json({
      success: true,
      message: "User registered successfully",
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Registration failed" });
  }
};

/* ================= LOGIN ================= */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select("+password"); // include password for comparison
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    // Remove password from response
    const safeUser = user.toObject();
    delete safeUser.password;

    res.json({ token, user: safeUser });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ message: "Login failed" });
  }
};