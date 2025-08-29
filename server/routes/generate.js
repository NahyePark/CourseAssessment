const express = require("express");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");
const archiver = require("archiver");
const { v4: uuidv4 } = require("uuid");

const router = express.Router();

const outputDir = path.join(__dirname, "../pdfs");
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

const EXEC_TIMEOUT_MS = 60_000;
const EXEC_MAX_BUFFER = 10 * 1024 * 1024;

router.post("/", (req, res) => {
	try{
		const { latex, semester, course } = req.body || {};
		 if (!latex || typeof latex !== 'string') {
			return res.status(400).json({ success: false, error: 'empty_latex' });
		}
		const id = uuidv4();
		const baseName = `${semester}_${course}_${id}`;
		const texPath = path.join(outputDir, `${baseName}.tex`);
		const pdfPath = path.join(outputDir, `${baseName}.pdf`);
		const zipPath = path.join(outputDir, `${baseName}.zip`);

		fs.writeFileSync(texPath, latex);

		const cmd = `pdflatex -interaction=nonstopmode -halt-on-error -file-line-error -output-directory="${outputDir}" "${texPath}"`;
		exec(cmd, { timeout: EXEC_TIMEOUT_MS, maxBuffer: EXEC_MAX_BUFFER }, (err, stdout, stderr) => {
		    const logPath = path.join(outputDir, `${baseName}.log`);
			let logTail = (stderr || stdout || "");
			try {
				if (fs.existsSync(logPath)) {
				  const full = fs.readFileSync(logPath, "utf8");
				  
				  const lines = full.split(/\r?\n/);
				  logTail = lines.slice(Math.max(0, lines.length - 200)).join("\n");
				}
			} catch(e) { }
		
			if (err || !fs.existsSync(pdfPath)) {
				console.error("LaTeX compile error:", logTail);
				return res.status(500).json({
				  success: false,
				  error: err?.killed ? "timeout_or_killed" : "latex_failed",
				  exitCode: err?.code ?? null,
				  signal: err?.signal ?? null,
				  log: logTail
				});
			}

			const output = fs.createWriteStream(zipPath);
			const archive = archiver("zip", { zlib: { level: 9 } });

			output.on("close", () => {
				res.json({
					pdfUrl: `http://localhost:5000/pdfs/${baseName}.pdf`,
					latexUrl: `http://localhost:5000/pdfs/${baseName}.tex`,
					zipUrl: `http://localhost:5000/pdfs/${baseName}.zip`
				});
				
				// delete the temp files after 5 minutes
				setTimeout(() => {
					[texPath, pdfPath, zipPath,
					 `${outputDir}/${baseName}.log`,
					 `${outputDir}/${baseName}.aux`].forEach(file => {
						fs.unlink(file, err => {
							if (err) console.error("Failed to delete:", file);
						});
					});
				}, 10 * 60 * 1000); 
			});

			archive.on("error", err => {
				console.error("ZIP archive error:", err);
				res.status(500).json({ success: false, error: "zip_failed", detail: String(err) });
			});
			
			const internalName = `${semester}_${course}_CourseAssessmentReport`;

			archive.pipe(output);
			archive.file(texPath, { name: `${internalName}.tex` });
			archive.file(pdfPath, { name: `${internalName}.pdf` });
			archive.finalize();
		});
	} catch(e){
		console.error('[generate error]', e);
		return res.status(500).json({ success: false, error: 'server_exception', detail: String(e) });
	}
});

module.exports = router;