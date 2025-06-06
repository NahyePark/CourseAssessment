const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());
app.use("/pdfs", express.static(path.join(__dirname, "pdfs")));
app.use("/latex", express.static(path.join(__dirname, "pdfs")));

// Route modules
app.use("/generate", require("./routes/generate"));
app.use("/api", require("./routes/api"));

app.get("/pdfs/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "pdfs", filename);

    if (fs.existsSync(filePath)) {
        res.setHeader("Content-Disposition", `attachment; filename=${filename}`);
        res.setHeader("Content-Type", "application/pdf");
        res.sendFile(filePath);
    } else {
        res.status(404).send("File not found");
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});