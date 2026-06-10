const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');

const authRoutes = require('./routes/authRoutes');
const reportRoutes = require("./routes/reportRoutes");

dotenv.config();

connectDB();


const app = express();
app.use(express.json());

app.use('/api/auth', authRoutes)
app.use("/api/reports", reportRoutes);

app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});