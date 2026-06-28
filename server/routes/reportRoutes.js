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
  assignWorker,
  getAssignedReports,
} = require("../controllers/reportController");
const {
  protect,
  workerOnly,
  adminOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllReports);
router.get("/nearby", getNearbyReports);
router.get("/my-reports", protect, getMyReports);
router.get("/my-assigned", protect, workerOnly, getAssignedReports);
router.get("/:id", getSingleReport);

router.post("/", protect, createReport);

router.put("/:id", protect, updateReport);

router.patch("/:id/status", protect, workerOnly, updateReportStatus);
router.patch("/:id/upvote", protect, toggleUpvote);
router.patch("/:id/assign", protect, adminOnly, assignWorker);

router.delete("/:id", protect, deleteReport);

module.exports = router;