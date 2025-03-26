const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
const path = require("path");
const cors = require("cors");
const archiver = require("archiver");

const app = express();
const PORT = 5000;

app.use(cors({
    origin: 'http://localhost:3000',
}));
app.use(express.json());
app.use("/pdfs", express.static(path.join(__dirname, "pdfs"))); 
app.use("/latex", express.static(path.join(__dirname, "pdfs")));

const outputDir = path.join(__dirname, "pdfs");
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

app.post("/generate", (req, res) => {
    const latex = req.body.latex;
	const texPath = path.join(outputDir, "course_assessment.tex");
    const pdfPath = path.join(outputDir, "course_assessment.pdf");
    const zipPath = path.join(outputDir, "course_assessment.zip");

    fs.writeFileSync(texPath, latex);


    exec(`pdflatex -output-directory=${outputDir} ${texPath}`, (err, stdout, stderr) => {
        if (err) {
            console.error("LaTeX compile error:", stderr);
            return res.status(500).send("PDF generation failed");
        }

		console.error("LaTeX compile errors (stderr):", stderr);

        if (fs.existsSync(pdfPath)) {
            console.log("PDF generated successfully");
			
			const output = fs.createWriteStream(zipPath);
            const archive = archiver("zip", { zlib: { level: 9 } });
			
			output.on("close", () => {
                console.log(`ZIP file created: ${zipPath}`);
                res.json({
                    pdfUrl: `http://localhost:${PORT}/pdfs/course_assessment.pdf`,
                    latexUrl: `http://localhost:${PORT}/latex/course_assessment.tex`,
                    zipUrl: `http://localhost:${PORT}/pdfs/course_assessment.zip`
                });
            });
			
            archive.on("error", (err) => {
                console.error("ZIP archive error:", err);
                res.status(500).send("ZIP creation failed");
            });
			
			archive.pipe(output);
            archive.file(texPath, { name: "course_assessment.tex" });
            archive.file(pdfPath, { name: "course_assessment.pdf" });
            archive.finalize();
        } else {
            console.error("PDF generation failed");
            return res.status(500).send("PDF generation failed");
        }
    });
});

app.get("/pdfs/:filename", (req, res) => {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, "pdfs", filename);

    if (fs.existsSync(filePath)) {
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
		res.setHeader('Content-Type', 'application/pdf');
        res.sendFile(filePath);
    } else {
        res.status(404).send('File not found');
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});