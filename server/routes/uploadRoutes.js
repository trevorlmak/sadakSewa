const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadMiddleware");

const { protect } = require("../middleware/authMiddleware");
const {
  uploadImages,
  deleteImage,
} = require("../controllers/uploadController");


router.post(
  "/",
  protect,
  upload.array("images", 5),
  uploadImages
);

router.delete(
  "/",
  protect,
  deleteImage
);

module.exports = router;