const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

const authRoutes = require('./routes/authRoutes');
const reportRoutes = require("./routes/reportRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

dotenv.config();

connectDB();


const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes)
app.use("/api/reports", reportRoutes);
app.use("/api/upload", uploadRoutes);
// app.use((err, req, res, next) => {
//     console.error("--- SERVER ERROR STACK ---");
//     console.error(err); // This prints the actual error to your VS Code terminal
//     console.error("--------------------------");

//     // This forces Postman to receive JSON instead of HTML
//     res.status(err.status || 500).json({
//         success: false,
//         message: err.message || "An unknown error occurred",
//     });
// });

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});