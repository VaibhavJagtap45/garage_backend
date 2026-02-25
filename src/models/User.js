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

    avatar: {
  type: String,
  default: null,
},
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