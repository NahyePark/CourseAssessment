const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());


// Route modules
app.use("/generate", require("./routes/generate"));
app.use("/api", require("./routes/api"));

app.get("/pdfs/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "pdfs", filename);

    if (!fs.existsSync(filePath)) {
        return res.status(404).send("File not found");
    }

    const ext = path.extname(filename); // pdf, tex, zip
    const [semester, course] = filename.split("_");

    const displayName = `${semester}_${course}_CourseAssessmentReport${ext}`;

    const mimeTypes = {
        ".pdf": "application/pdf",
        ".tex": "application/octet-stream",
        ".zip": "application/zip"
    };

    res.setHeader("Content-Disposition", `attachment; filename="${displayName}"`);
    res.setHeader("Content-Type", mimeTypes[ext] || "application/octet-stream");
    res.sendFile(filePath);
});


app.use("/pdfs", express.static(path.join(__dirname, "pdfs")));
app.use("/latex", express.static(path.join(__dirname, "pdfs")));

//React Build file
app.use(express.static(path.join(__dirname, '../OutcomeView/build')));

// React SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../OutcomeView/build', 'index.html'));
});


app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
