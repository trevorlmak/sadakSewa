const mongoose = require("mongoose");

const reportHistorySchema = new mongoose.Schema(
  {
    report: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Report",
      required: true,
    },
    action: {
      type: String,
      enum: [
        "created",
        "updated",
        "assigned",
        "status_changed",
        "upvoted",
        "removed_upvote",
        "deleted",
      ],
      required: true,
    },
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

reportHistorySchema.index({ report: 1, createdAt: 1 });

module.exports = mongoose.model("ReportHistory", reportHistorySchema);