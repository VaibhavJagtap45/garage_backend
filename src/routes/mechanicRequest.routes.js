const User = require("../models/User");
const Mechanic = require("../models/Mechanic");
const MechanicRequest = require("../models/MechanicRequest");

// List all garages (owners with garageName)
exports.listGarages = async (req, res) => {
  try {
    const garages = await User.find({ role: "owner", garageName: { $ne: null } })
      .select("name garageName garageAddress email phone");
    res.json(garages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mechanic applies to a garage
exports.applyToGarage = async (req, res) => {
  try {
    const { ownerId, message } = req.body;
    const mechanicId = req.user._id;

    // Check if owner exists and is owner
    const owner = await User.findOne({ _id: ownerId, role: "owner" });
    if (!owner) return res.status(404).json({ message: "Garage not found" });

    // Check if already requested
    const existing = await MechanicRequest.findOne({ mechanic: mechanicId, owner: ownerId });
    if (existing) {
      return res.status(400).json({ message: "You have already applied to this garage" });
    }

    // Check if already linked as mechanic
    const alreadyLinked = await Mechanic.findOne({ user: mechanicId, owner: ownerId });
    if (alreadyLinked) {
      return res.status(400).json({ message: "You are already a mechanic at this garage" });
    }

    const request = await MechanicRequest.create({
      mechanic: mechanicId,
      owner: ownerId,
      message,
    });

    res.status(201).json(request);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Mechanic view their requests
exports.getMyRequests = async (req, res) => {
  try {
    const requests = await MechanicRequest.find({ mechanic: req.user._id })
      .populate("owner", "garageName name email");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Owner view pending requests for their garage
exports.getPendingRequestsForOwner = async (req, res) => {
  try {
    const requests = await MechanicRequest.find({ owner: req.user._id, status: "pending" })
      .populate("mechanic", "name email phone");
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Approve a request
exports.approveRequest = async (req, res) => {
  try {
    const request = await MechanicRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your request" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    // Create mechanic link if not exists
    let mechanic = await Mechanic.findOne({ user: request.mechanic, owner: request.owner });
    if (!mechanic) {
      // You may want to copy name/phone from the user or request additional info
      const user = await User.findById(request.mechanic);
      mechanic = await Mechanic.create({
        owner: request.owner,
        user: request.mechanic,
        name: user.name,
        phone: user.phone,
        skills: [],
        experienceYears: 0,
        isAvailable: true,
      });
    }

    request.status = "approved";
    request.respondedAt = new Date();
    await request.save();

    res.json({ message: "Request approved", mechanic });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Reject a request
exports.rejectRequest = async (req, res) => {
  try {
    const request = await MechanicRequest.findById(req.params.requestId);
    if (!request) return res.status(404).json({ message: "Request not found" });
    if (request.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not your request" });
    }
    if (request.status !== "pending") {
      return res.status(400).json({ message: "Request already processed" });
    }

    request.status = "rejected";
    request.respondedAt = new Date();
    await request.save();

    res.json({ message: "Request rejected" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};