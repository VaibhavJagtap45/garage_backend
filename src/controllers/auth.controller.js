// const User = require("../models/User");
// const bcrypt = require("bcryptjs");
// const jwt = require("jsonwebtoken");

// // REGISTER
// // exports.register = async (req, res) => {
// //   try {
// //     const { name, email, password, phone } = req.body;

// //     const exists = await User.findOne({ email });
// //     if (exists)
// //       return res.status(400).json({ message: "Email already registered" });

// //     const hash = await bcrypt.hash(password, 10);

// //     const user = await User.create({
// //       name,
// //       email,
// //       password: hash,
// //       phone,
// //     });

// //     res.json({ message: "User registered" });
// //   } catch (err) {
// //     res.status(500).json(err);
// //   }
// // };


// exports.register = async (req, res) => {
//   try {
//     const { name, email, password, phone, role } = req.body;

//     const exists = await User.findOne({ email });
//     if (exists)
//       return res.status(400).json({ message: "Email already registered" });

//     const hash = await bcrypt.hash(password, 10);

//     const user = await User.create({
//       name,
//       email,
//       password: hash,
//       phone,
//       role: role || "customer", // 👈 IMPORTANT
//     });

//     res.json({ message: "User registered", user });
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

// // LOGIN
// exports.login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     const user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: "Invalid email" });

//     const match = await bcrypt.compare(password, user.password);
//     if (!match) return res.status(400).json({ message: "Wrong password" });

//     // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//     //   expiresIn: "7d",
//     // });
//     const token = jwt.sign(
//   { id: user._id, role: user.role }, // 👈 include role
//   process.env.JWT_SECRET,
//   { expiresIn: "7d" }
// );

//     res.json({ token, user });
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };






















// auth.controller.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

/**
 * Register - always create as customer (prevent client-side role escalation)
 */
exports.register = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: "Email already registered" });

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hash,
      phone,
      role: "customer", // force customer by default
    });

    // create token
    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({ message: "User registered", user: { ...user.toObject(), password: undefined }, token });
  } catch (err) {
    console.error("Auth register error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

/**
 * Login
 */
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(400).json({ message: "Invalid email or password" });

    const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token, user: { ...user.toObject(), password: undefined } });
  } catch (err) {
    console.error("Auth login error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};