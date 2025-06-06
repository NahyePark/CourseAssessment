const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password!",
    database: "rubric_db"
});

const filePath = path.join(__dirname, "rubrics-db.txt");
const rawText = fs.readFileSync(filePath, "utf-8");

const blocks = rawText.trim().split(/\n\s*\n/);

// Summary
let total = blocks.length;
let inserted = 0;
let skipped = 0;
let failed = 0;

blocks.forEach((block, index) => {
    const lines = block.trim().split("\n").map(line => line.replace(/^"|"$/g, "").trim());

    if (lines.length !== 11) {
        console.warn(`Skipping block ${index + 1}: Expected 11 lines, found ${lines.length}`);
        failed++;
        return;
    }

    const [
        course,
        semester,
        slo,
        level,
        exercise,
        pi,
        description,
        unsatisfactory,
        developing,
        satisfactory,
        exemplary
    ] = lines;

    // Check for duplicate
    const checkSql = `
        SELECT id FROM rubrics WHERE course = ? AND semester = ? AND slo = ? AND exercise = ?
    `;

    db.query(checkSql, [course, semester, slo, exercise], (err, results) => {
        if (err) {
            console.error(`Error checking block ${index + 1}:`, err);
            failed++;
            return;
        }

        if (results.length > 0) {
            console.log(`Skipping duplicate block ${index + 1} (course: ${course}, exercise: ${exercise})`);
            skipped++;
            return;
        }

        // Insert new entry
        const insertSql = `
            INSERT INTO rubrics (course, semester, slo, level, exercise, pi, description, unsatisfactory, developing, satisfactory, exemplary)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
            course, semester, slo, level, exercise, pi, description,
            unsatisfactory, developing, satisfactory, exemplary
        ];

        db.query(insertSql, values, (err, result) => {
            if (err) {
                console.error(`Error inserting block ${index + 1} ${course}:`, err);
				console.error(`Content:\n${block}\n`);
                failed++;
            } else {
                console.log(`Inserted block ${index + 1} (ID: ${result.insertId})`);
                inserted++;
            }

            if (inserted + skipped + failed === total) {
                console.log(`\nSummary:
- Total blocks: ${total}
- Inserted: ${inserted}
- Skipped (duplicates): ${skipped}
- Failed: ${failed}
`);
                db.end();
            }
        });
    });
});