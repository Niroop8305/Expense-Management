const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./utils/db");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

const PORT = process.env.PORT || 5000;

connectDB();

app.use("/api/auth", require("./routes/auth"));
app.use("/api/users", require("./routes/users"));
app.use("/api/expenses", require("./routes/expenses"));
app.use("/api/currency", require("./routes/currency"));

app.get("/", (req, res) => res.send({ ok: true }));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
