const express = require("express");
const {
  createReport,
  getAllReports,
  getSingleReport,
  deleteReport,
  updateReportStatus,
  getNearbyReports,
  updateReport,
  getMyReports,
  toggleUpvote,
} = require("../controllers/reportController");
const {
  protect,
  workerOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllReports);
router.get("/nearby", getNearbyReports);
router.get("/my-reports", protect, getMyReports);
router.get("/:id", getSingleReport);

router.post("/", protect, createReport);

router.put("/:id", protect, updateReport);

router.patch("/:id/status", protect, workerOnly, updateReportStatus);
router.patch("/:id/upvote", protect, toggleUpvote);

router.delete("/:id", protect, deleteReport);

module.exports = router;