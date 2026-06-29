const express = require("express");
const router = express.Router();

const upload = require("../middleware/uploadMiddleware");
const { protect } = require("../middleware/authMiddleware");

const {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  updateProfilePicture,
} = require("../controllers/authController");

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/logout", protect, logoutUser);
router.get("/profile", protect, getProfile);
router.put("/profile", protect, updateProfile);
router.patch(
  "/profile/picture",
  protect,
  upload.single("profilePicture"),
  updateProfilePicture
);

module.exports = router;