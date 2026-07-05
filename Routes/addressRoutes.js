const express = require("express");
const mongoose = require("mongoose");
const Address = require("../Models/addresschema");
const authMiddleware = require("../Middlewares/authMiddleware");
const { validateObjectId } = require("../Middlewares/security");

const router = express.Router();

const cleanText = (value) => String(value || "").trim().replace(/\s+/g, " ");

const assertSameUser = (req, res, userId) => {
  if (!mongoose.Types.ObjectId.isValid(userId)) {
    res.status(400).json({ message: "Invalid userId" });
    return false;
  }

  if (req.user._id.toString() !== userId.toString()) {
    res.status(403).json({ message: "Address access denied" });
    return false;
  }

  return true;
};

router.post("/", authMiddleware, async (req, res) => {
  try {
    const userId = req.body.userId || req.user._id.toString();

    if (!assertSameUser(req, res, userId)) return;

    const addressInput = {
      fullName: cleanText(req.body.fullName),
      street: cleanText(req.body.street),
      city: cleanText(req.body.city),
      state: cleanText(req.body.state),
      postalCode: cleanText(req.body.postalCode),
      country: cleanText(req.body.country),
      phone: cleanText(req.body.phone),
    };

    if (Object.values(addressInput).some((value) => !value)) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (addressInput.phone.length < 7 || addressInput.phone.length > 20) {
      return res.status(400).json({ message: "Invalid phone" });
    }

    const address = new Address({
      user: req.user._id,
      ...addressInput,
    });

    const savedAddress = await address.save();
    return res.status(201).json(savedAddress);
  } catch (error) {
    console.error("Error creating address:", error);
    return res.status(500).json({ message: "Server error while adding address" });
  }
});

router.get("/:userId", authMiddleware, validateObjectId("userId"), async (req, res) => {
  try {
    const { userId } = req.params;

    if (!assertSameUser(req, res, userId)) return;

    const addresses = await Address.find({ user: req.user._id }).sort({ createdAt: -1 });
    return res.status(200).json(addresses);
  } catch (err) {
    console.error("Error fetching addresses:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
