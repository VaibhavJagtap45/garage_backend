// const Service = require("../models/Service");

// // CREATE
// exports.createService = async (req, res) => {
//   try {
//     const service = await Service.create({
//       ...req.body,
//       image: req.file?.filename,
//       owner: req.user._id,
//     });

//     res.json(service);
//   } catch (err) {
//     res.status(500).json(err);
//   }
// };

// // GET ALL
// exports.getServices = async (req, res) => {
//   const services = await Service.find().populate("owner", "name phone");
//   res.json(services);
// };

// // GET ONE
// exports.getService = async (req, res) => {
//   const service = await Service.findById(req.params.id);
//   res.json(service);
// };





// services.controller.js
const Service = require("../models/Service");

/** Create service (owner) */
exports.createService = async (req, res) => {
  try {
    const { title, description, price, durationMinutes } = req.body;

    if (!title) return res.status(400).json({ message: "Title is required" });

    const service = await Service.create({
      title,
      description,
      price: Number(price),
      durationMinutes: Number(durationMinutes),
      image: req.file?.filename,
      owner: req.user._id,
    });

    res.status(201).json(service);
  } catch (err) {
    console.error("createService error:", err);
    res.status(500).json({ message: err.message });
  }
};

/** Get all services (public) */
exports.getServices = async (req, res) => {
  try {
    const services = await Service.find().populate("owner", "name phone");
    res.json(services);
  } catch (err) {
    console.error("getServices error:", err);
    res.status(500).json({ message: err.message });
  }
};

/** Get single service */
exports.getService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) return res.status(404).json({ message: "Not found" });
    res.json(service);
  } catch (err) {
    console.error("getService error:", err);
    res.status(500).json({ message: err.message });
  }
};

/** UPDATE SERVICE (owner only) */
exports.updateService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service)
      return res.status(404).json({ message: "Service not found" });

    // only owner can edit
    if (service.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "You are not allowed to edit this service" });

    const { title, description, price, durationMinutes } = req.body;

    if (title !== undefined) service.title = title;
    if (description !== undefined) service.description = description;
    if (price !== undefined) service.price = Number(price);
    if (durationMinutes !== undefined) service.durationMinutes = Number(durationMinutes);

    // new image uploaded
    if (req.file) service.image = req.file.filename;

    await service.save();

    res.json({ message: "Service updated successfully", service });
  } catch (err) {
    console.error("updateService error:", err);
    res.status(500).json({ message: err.message });
  }
};


/** DELETE SERVICE (owner only) */
exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);

    if (!service)
      return res.status(404).json({ message: "Service not found" });

    // owner check
    if (service.owner.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "You are not allowed to delete this service" });

    await service.deleteOne();

    res.json({ message: "Service deleted successfully" });
  } catch (err) {
    console.error("deleteService error:", err);
    res.status(500).json({ message: err.message });
  }
};

// add this to services.controller.js
/** Get current owner's services */
exports.getMyServices = async (req, res) => {
  try {
    const services = await Service.find({ owner: req.user._id }).sort({ createdAt: -1 });
    res.json(services);
  } catch (err) {
    console.error("getMyServices error:", err);
    res.status(500).json({ message: "Failed to fetch your services" });
  }
};