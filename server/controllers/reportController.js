const Report = require("../models/reportModel");

const VALID_STATUSES = ["pending", "verified", "in_progress", "resolved", "rejected"];


const merge = (left, right, compareFn) => {
  const result = [];
  let i = 0, j = 0;

  while (i < left.length && j < right.length) {
    if (compareFn(left[i], right[j]) <= 0) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  return [...result, ...left.slice(i), ...right.slice(j)];
};

const mergeSort = (arr, compareFn) => {
  if (arr.length <= 1) return arr;

  const mid = Math.floor(arr.length / 2);
  const left  = mergeSort(arr.slice(0, mid), compareFn);
  const right = mergeSort(arr.slice(mid), compareFn);

  return merge(left, right, compareFn);
};

const SORT_COMPARATORS = {
  createdAt_desc: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  createdAt_asc:  (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  severity_desc: (a, b) => {
    const order = { high: 3, medium: 2, low: 1 };
    return (order[b.severity] || 0) - (order[a.severity] || 0);
  },
  severity_asc: (a, b) => {
    const order = { high: 3, medium: 2, low: 1 };
    return (order[a.severity] || 0) - (order[b.severity] || 0);
  },
  title_asc:  (a, b) => a.title.localeCompare(b.title),
  title_desc: (a, b) => b.title.localeCompare(a.title),
};


const createReport = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      severity,
      municipality,
      locationName,
      longitude,
      latitude,
      images,
    } = req.body;

    if (!title || !description || !category || longitude === undefined || longitude === null || latitude === undefined || latitude === null) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const report = await Report.create({
      title,
      description,
      category,
      severity,
      municipality,
      locationName,
      images: images || [],
      reportedBy: req.user._id,
      location: {
        type: "Point",
        coordinates: [Number(longitude), Number(latitude)],
      },
    });

    res.status(201).json({
      success: true,
      message: "Report created successfully",
      report,
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    res.status(500).json({
      success: false,
      message: isDev ? error.message : "Internal server error",
    });
  }
};

const getAllReports = async (req, res) => {
  try {

    const page  = parseInt(req.query.page)  || 1;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const skip  = (page - 1) * limit;

    const filter = {};

    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.severity) filter.severity = req.query.severity;

    if (req.query.municipality) {
      filter.municipality = { $regex: req.query.municipality, $options: "i" };
    }

    if (req.query.search) {
      filter.$or = [
        { title:        { $regex: req.query.search, $options: "i" } },
        { description:  { $regex: req.query.search, $options: "i" } },
        { locationName: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const total = await Report.countDocuments(filter);

    const rawReports = await Report.find(filter)
      .populate("reportedBy", "fullName email profilePicture")
      .populate("assignedWorker", "fullName email");

    const sortBy    = req.query.sortBy || "createdAt";   // createdAt | severity | title
    const order     = req.query.order  || "desc";        // asc | desc
    const comparatorKey = `${sortBy}_${order}`;
    const compareFn = SORT_COMPARATORS[comparatorKey] || SORT_COMPARATORS.createdAt_desc;

    const sortedReports = mergeSort(rawReports, compareFn);

    const paginatedReports = sortedReports.slice(skip, skip + limit);

    res.status(200).json({
      success: true,
      count: paginatedReports.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      sortedBy: comparatorKey,
      reports: paginatedReports,
    });

  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    res.status(500).json({
      success: false,
      message: isDev ? error.message : "Internal server error",
    });
  }
};

const getSingleReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("reportedBy", "fullName email profilePicture")
      .populate("assignedWorker", "fullName email");

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    res.status(200).json({
      success: true,
      report,
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    res.status(500).json({
      success: false,
      message: isDev ? error.message : "Internal server error",
    });
  }
};

const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    if (
      report.reportedBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }

    await report.deleteOne();

    res.status(200).json({
      success: true,
      message: "Report deleted successfully",
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    res.status(500).json({
      success: false,
      message: isDev ? error.message : "Internal server error",
    });
  }
};

const updateReportStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${VALID_STATUSES.join(", ")}`,
      });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    report.status = status;
    await report.save();

    res.status(200).json({
      success: true,
      message: "Report status updated successfully",
      report,
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    res.status(500).json({
      success: false,
      message: isDev ? error.message : "Internal server error",
    });
  }
};

const getNearbyReports = async (req, res) => {
  try {
    const { longitude, latitude, distance = 5000 } = req.query;

    if (
      longitude === undefined ||
      longitude === null ||
      latitude === undefined ||
      latitude === null
    ) {
      return res.status(400).json({
        success: false,
        message: "Longitude and latitude are required",
      });
    }

    const reports = await Report.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [Number(longitude), Number(latitude)],
          },
          $maxDistance: Number(distance),
        },
      },
    })
      .populate("reportedBy", "fullName email profilePicture")
      .populate("assignedWorker", "fullName email");

    res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    res.status(500).json({
      success: false,
      message: isDev ? error.message : "Internal server error",
    });
  }
};

const updateReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }
    if (
      report.reportedBy.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized",
      });
    }
    const allowedFields = [
      "title",
      "description",
      "category",
      "severity",
      "municipality",
      "locationName",
      "images",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        report[field] = req.body[field];
      }
    });
    await report.save();
    res.status(200).json({
      success: true,
      message: "Report updated successfully",
      report,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createReport,
  getAllReports,
  getSingleReport,
  deleteReport,
  updateReportStatus,
  getNearbyReports,
  updateReport,
};