exports.verifyEmail = (req, res) => {
  return res.status(410).json({ msg: "Legacy verification route disabled" });
};
