// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },

//     email: {
//       type: String,
//       required: true,
//       unique: true,
//       lowercase: true,
//       index: true,
//     },

//     password: { type: String, required: true },

//     phone: String,

//     role: {
//       type: String,
//       enum: ["customer", "owner", "mechanic"],
//       default: "customer",
//       required: true,
//     },

//     avatar: String,
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("User", userSchema);




// // src/models/User.js  (update)
// const mongoose = require("mongoose");

// const addressSchema = new mongoose.Schema({
//   placeId: String,           // google place_id (stable)
//   formattedAddress: String,  // full address string
//   street: String,
//   city: String,
//   state: String,
//   postalCode: String,
//   country: String,
//   location: {                // geo for queries
//     type: { type: String, enum: ["Point"], default: "Point" },
//     coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
//   },
// });

// const userSchema = new mongoose.Schema(
//   {
//     name: { type: String, required: true },
//     email: { type: String, unique: true, required: true, lowercase: true },
//     password: { type: String, required: true },
//     phone: String,
//     role: {
//       type: String,
//       enum: ["customer", "owner", "mechanic"],
//       default: "customer",
//       required: true,
//     },
//     avatar: String,

//     // owner-specific
//     garageName: String,
//     garageAddress: addressSchema,    // structured address for owner
//     openingHours: [String],          // optional: ["Mon-Fri 9:00-18:00", ...]
//     offersDoorstep: { type: Boolean, default: false }, // owner offers doorstep service
//     serviceAreaKm: { type: Number, default: 5 },       // service radius
//   },
//   { timestamps: true }
// );

// module.exports = mongoose.model("User", userSchema);



// const mongoose = require("mongoose");

// const userSchema = new mongoose.Schema(
//   {
//     name: String,
//     email: { type: String, unique: true },
//     password: String,
//     phone: String,

//     role: {
//       type: String,
//       enum: ["customer", "owner", "mechanic"],
//       default: "customer",
//     },

//     avatar: String,

//     // customer address
//    address: {
//   formattedAddress: String,
//   placeId: String,
//   location: {
//     type: {
//       type: String,
//       enum: ["Point"],
//       required: false
//     },
//     coordinates: {
//       type: [Number],
//       required: false
//     }
//   }
// },

// garageAddress: {
//   formattedAddress: String,
//   placeId: String,
//   location: {
//     type: {
//       type: String,
//       enum: ["Point"],
//       required: false
//     },
//     coordinates: {
//       type: [Number],
//       required: false
//     }
//   }
// },

//     // owner garage details
//     garageName: String,
//     garageAddress: {
//       formattedAddress: String,
//       location: {
//         type: { type: String, default: "Point" },
//         coordinates: [Number],
//       },
//     },
//     openingHours: String,
//     offersDoorstep: Boolean,
//     serviceAreaKm: Number,
//   },
//   { timestamps: true }
// );

// userSchema.index({ "garageAddress.location": "2dsphere" });

// module.exports = mongoose.model("User", userSchema);


const mongoose = require("mongoose");

/* ---------- GEO LOCATION SCHEMA ---------- */
const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      required: true,
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true,
    },
  },
  { _id: false }
);

/* ---------- USER SCHEMA ---------- */
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true },
    password: String,
    phone: String,

    role: {
      type: String,
      enum: ["customer", "owner", "mechanic"],
      default: "customer",
    },

    avatar: String,

    /* ---------- CUSTOMER ADDRESS (OPTIONAL) ---------- */
    address: {
      formattedAddress: String,
      placeId: String,
      location: {
        type: locationSchema,
        default: undefined,   // ⭐ IMPORTANT (prevents crash)
      },
    },

    /* ---------- OWNER GARAGE DETAILS ---------- */
    garageName: String,

    garageAddress: {
      formattedAddress: String,
      placeId: String,
      location: {
        type: locationSchema,
        default: undefined,   // ⭐ VERY IMPORTANT
      },
    },

    openingHours: String,
    offersDoorstep: Boolean,
    serviceAreaKm: Number,
  },
  { timestamps: true }
);

/* ---------- 2DSPHERE INDEX ---------- */
userSchema.index(
  { "garageAddress.location": "2dsphere" },
  { sparse: true } // ⭐ prevents Mongo crash when location absent
);

module.exports = mongoose.model("User", userSchema);