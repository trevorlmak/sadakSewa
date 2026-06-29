const User = require("../models/userModel");
const generateToken = require("../utils/generateToken");
const cloudinary = require("../config/cloudinary");

const registerUser = async (req, res) => {
  try {
    const { fullName, email, password, phone, municipality } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please fill all required fields",
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      fullName,
      email,
      password,
      phone: phone || null,
      municipality: municipality || null,
    });

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        municipality: user.municipality,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    res.status(500).json({
      success: false,
      message: isDev ? error.message : "Internal server error",
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Your account has been deactivated",
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const token = generateToken(user._id);

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        municipality: user.municipality,
        profilePicture: user.profilePicture,
      },
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    res.status(500).json({
      success: false,
      message: isDev ? error.message : "Internal server error",
    });
  }
};

const logoutUser = async (req, res) => {
  res.cookie("token", "", {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

const getProfile = async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    res.status(500).json({
      success: false,
      message: isDev ? error.message : "Internal server error",
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const allowedFields = ["fullName", "phone", "municipality"];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    ).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    res.status(500).json({
      success: false,
      message: isDev ? error.message : "Internal server error",
    });
  }
};

const getPublicIdFromUrl = (url) => {
  const parts = url.split("/");
  const versionIndex = parts.findIndex((p) => p.startsWith("v") && !isNaN(p.slice(1)));
  const relevantParts = parts.slice(versionIndex + 1);
  const lastPart = relevantParts[relevantParts.length - 1];
  relevantParts[relevantParts.length - 1] = lastPart.replace(/\.[^/.]+$/, "");
  return relevantParts.join("/");
};

const updateProfilePicture = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image provided",
      });
    }

    const user = await User.findById(req.user._id);

    if (user.profilePicture) {
      try {
        const publicId = getPublicIdFromUrl(user.profilePicture);
        await cloudinary.uploader.destroy(publicId);
      } catch {
        // old image deletion failed — not critical, continue anyway
      }
    }

    user.profilePicture = req.file.path;
    await user.save();

    const updatedUser = await User.findById(user._id).select("-password");

    res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === "development";
    res.status(500).json({
      success: false,
      message: isDev ? error.message : "Internal server error",
    });
  }
};

module.exports = {
  registerUser,
  loginUser,
  logoutUser,
  getProfile,
  updateProfile,
  updateProfilePicture,
};