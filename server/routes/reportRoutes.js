const express = require("express");
const {
  createReport,
  getAllReports,
  getSingleReport,
  deleteReport,
  updateReportStatus,
  getNearbyReports,
  updateReport,
} = require("../controllers/reportController");
const {
  protect,
  workerOnly,
} = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", getAllReports);
router.get("/nearby", getNearbyReports);
router.get("/:id", getSingleReport);

router.post("/", protect, createReport);
router.put("/:id", protect, updateReport);
router.delete("/:id", protect, deleteReport);
router.patch("/:id/status", protect, workerOnly, updateReportStatus);

module.exports = router;