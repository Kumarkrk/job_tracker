const express = require("express");
const { create, get, currentUser } = require("../controlling/userController");
const { auth } = require("../middleware/auth");

const router = express.Router();

router.post("/register", create);
router.post("/login", get);
router.get("/me", auth, currentUser);

module.exports = router;
