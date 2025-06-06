const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");

const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password!",
    database: "PI_db"
});

const filePath = path.join(__dirname, "PI-db.txt");
const rawText = fs.readFileSync(filePath, "utf-8");

const sections = rawText.trim().split(/\n\s*\n/);

let inserted = 0;
let failed = 0;

sections.forEach((section, index) => {
    const lines = section.trim().split("\n").map(line => line.trim()).filter(Boolean);
    const course = lines[0];
    const indicators = lines.slice(1);

    indicators.forEach(indicator => {
        const checkSql = "SELECT id FROM pis WHERE course = ? AND indicator = ?";
        db.query(checkSql, [course, indicator], (err, results) => {
            if (err) {
                console.error(`Error checking course ${course}:`, err);
                failed++;
                return;
            }

            if (results.length > 0) {
                console.log(`Skipping duplicate: ${course} → ${indicator}`);
                return;
            }

            const insertSql = "INSERT INTO pis (course, indicator) VALUES (?, ?)";
            db.query(insertSql, [course, indicator], (err) => {
                if (err) {
                    console.error(`Error inserting: ${course} → ${indicator}`, err);
                    failed++;
                } else {
                    console.log(`Inserted: ${course} → ${indicator}`);
                    inserted++;
                }
            });
        });
    });
});

setTimeout(() => {
    console.log(`\nSummary:
- Inserted: ${inserted}
- Failed: ${failed}
`);
    db.end();
}, 5000);