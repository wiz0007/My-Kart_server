exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  const user = await user.findOne({ verificationToken: token });
  if (!user) return res.status(400).json({ msg: "Invalid token" });

  user.isVerified = true;
  user.verificationToken = null;
  await user.save();

  res.send("Email verified successfully!");
};
