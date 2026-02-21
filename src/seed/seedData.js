require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const connectDB = require("../config/db");
const User = require("../models/User");
const Service = require("../models/Service");

const seed = async () => {
  await connectDB();

  await User.deleteMany();
  await Service.deleteMany();

  const owner = await User.create({
    name: "Garage Owner",
    email: "owner@gmail.com",
    password: await bcrypt.hash("123456", 10),
    role: "owner",
  });

  await Service.insertMany([
    {
      title: "Oil Change",
      description: "Engine oil replacement",
      price: 500,
      duration: 30,
      owner: owner._id,
    },
    {
      title: "Car Wash",
      description: "Full foam wash",
      price: 300,
      duration: 20,
      owner: owner._id,
    },
  ]);

  console.log("🌱 Database Seeded");
  process.exit();
};

seed();
