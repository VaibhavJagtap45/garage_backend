// const mongoose = require("mongoose");

// const mechanicSchema = new mongoose.Schema(
//   {
//     name: String,
//     phone: String,
//     skills: [String],
//     owner: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//     },
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("Mechanic", mechanicSchema);






const mongoose = require("mongoose");

const mechanicSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: String,
    phone: String,
    skills: [String],
    experienceYears: Number,
    isAvailable: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Mechanic", mechanicSchema);