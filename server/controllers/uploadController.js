const cloudinary = require("../config/cloudinary");

const uploadImages = async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "No images provided",
            });
        }

        const images = req.files.map((file) => ({
            url: file.path,
            publicId: file.filename,
            originalName: file.originalname,
        }));

        res.status(200).json({
            success: true,
            message: "Images uploaded successfully",
            images,
        });
    } catch (error) {
        const isDev = process.env.NODE_ENV === "development";
        res.status(500).json({
            success: false,
            message: isDev ? error.message : "Internal server error",
        });
    }
};

const deleteImage = async (req, res) => {
    try {
        const { publicId } = req.body;

        if (!publicId) {
            return res.status(400).json({
                success: false,
                message: "Public ID is required",
            });
        }

        await cloudinary.uploader.destroy(publicId);

        res.status(200).json({
            success: true,
            message: "Image deleted successfully",
        });
    } catch (error) {
        const isDev = process.env.NODE_ENV === "development";
        res.status(500).json({
            success: false,
            message: isDev ? error.message : "Internal server error",
        });
    }
};

module.exports = { uploadImages, deleteImage };