const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Address = require("../Models/addresschema"); // ensure correct path

// ✅ POST: Add a new address
router.post("/", async (req, res) => {
  try {
    const { userId, fullName, street, city, state, postalCode, country, phone } = req.body;

    // Validate required fields
    if (!userId || !fullName || !street || !city || !state || !postalCode || !country || !phone) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid userId" });
    }

    const address = new Address({
      user: new mongoose.Types.ObjectId(userId),
      fullName,
      street,
      city,
      state,
      postalCode,
      country,
      phone,
    });

    const savedAddress = await address.save();
    res.status(201).json(savedAddress); // return the created address
  } catch (error) {
    console.error("Error creating address:", error);
    res.status(500).json({ message: "Server error while adding address" });
  }
});

// ✅ GET: Get all addresses for a user
router.get("/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // ✅ If schema already has `type: mongoose.Schema.Types.ObjectId`, no need to wrap
    const addresses = await Address.find({ user: userId });

    res.status(200).json(addresses);
  } catch (err) {
    console.error("Error fetching addresses:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

module.exports = router;

