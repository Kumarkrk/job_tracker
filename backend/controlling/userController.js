const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../database/user");

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function createToken(user) {
  return jwt.sign(
    {
      sub: user._id.toString(),
      email: user.email,
    },
    process.env.SECRET,
    { expiresIn: "1h" },
  );
}

function toPublicUser(user) {
  return {
    id: user._id,
    email: user.email,
    createdAt: user.createdAt,
  };
}

const create = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!emailPattern.test(email)) {
    return res.status(400).json({ message: "Please enter a valid email address" });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: "Password must be at least 6 characters" });
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(409).json({ message: "User already exists" });
  }

  const encryptedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: encryptedPassword });

  return res.status(201).json({
    message: "Account created successfully",
    token: createToken(user),
    user: toPublicUser(user),
  });
};

const get = async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const password = String(req.body.password || "");

  if (!email || !password) {
    return res.status(400).json({ message: "Email and password are required" });
  }

  const user = await User.findOne({ email });
  const passwordMatches = user
    ? await bcrypt.compare(password, user.password)
    : false;

  if (!passwordMatches) {
    return res.status(401).json({ message: "Invalid email or password" });
  }

  return res.status(200).json({
    message: "Login successful",
    token: createToken(user),
    user: toPublicUser(user),
  });
};

const currentUser = async (req, res) => {
  const user = await User.findById(req.user.sub).select("-password");

  if (!user) {
    return res.status(404).json({ message: "User account not found" });
  }

  return res.status(200).json({ user: toPublicUser(user) });
};

module.exports = { create, get, currentUser };
