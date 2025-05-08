const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const archiver = require("archiver");

const router = express.Router();

const outputDir = path.join(__dirname, "../pdfs");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

router.post("/", (req, res) => {
    const latex = req.body.latex;
    const texPath = path.join(outputDir, "course_assessment.tex");
    const pdfPath = path.join(outputDir, "course_assessment.pdf");
    const zipPath = path.join(outputDir, "course_assessment.zip");

    fs.writeFileSync(texPath, latex);

    exec(`pdflatex -output-directory=${outputDir} ${texPath}`, (err, stdout, stderr) => {
        if (err || !fs.existsSync(pdfPath)) {
            console.error("LaTeX compile error:", stderr);
            return res.status(500).send("PDF generation failed");
        }

        const output = fs.createWriteStream(zipPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", () => {
            res.json({
                pdfUrl: `http://localhost:5000/pdfs/course_assessment.pdf`,
                latexUrl: `http://localhost:5000/latex/course_assessment.tex`,
                zipUrl: `http://localhost:5000/pdfs/course_assessment.zip`
            });
        });

        archive.on("error", err => {
            console.error("ZIP archive error:", err);
            res.status(500).send("ZIP creation failed");
        });

        archive.pipe(output);
        archive.file(texPath, { name: "course_assessment.tex" });
        archive.file(pdfPath, { name: "course_assessment.pdf" });
        archive.finalize();
    });
});

module.exports = router;