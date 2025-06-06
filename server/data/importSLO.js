const fs = require("fs");
const path = require("path");
const mysql = require("mysql2");

// DB connection
const db = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "password!",
    database: "slo_db"
});


const filePath = path.join(__dirname, "SLO-db.txt");
const rawText = fs.readFileSync(filePath, "utf-8");
const lines = rawText.trim().split("\n");

let insertedSLOs = 0;
let insertedMappings = 0;

lines.forEach((line, index) => {
    line = line.trim();
    if (!line) return;

    const sloMatch = line.match(/^(CS\d+)\s+"(.+)"\s+(\w+)$/);
    if (sloMatch) {
        const [_, code, description, semester] = sloMatch;

        const checkSql = "SELECT id FROM slos WHERE code = ? AND semester = ?";
        db.query(checkSql, [code, semester], (err, results) => {
            if (err) {
                console.error(`Error checking SLO line ${index + 1}:`, err);
                return;
            }

            if (results.length > 0) {
                console.log(`Skipping duplicate SLO: ${code} (${semester})`);
                return;
            }

            const insertSql = `INSERT INTO slos (code, description, semester) VALUES (?, ?, ?)`;
            db.query(insertSql, [code, description, semester], (err) => {
                if (err) {
                    console.error(`Error inserting SLO line ${index + 1}:`, err);
                } else {
                    console.log(`Inserted SLO: ${code}`);
                    insertedSLOs++;
                }
            });
        });
    } else {
        const parts = line.split(/\s+/);
        if (parts.length === 3) {
            const [course, slo_code, level] = parts;

            const checkSql = "SELECT id FROM course_slos WHERE course = ? AND slo_code = ? AND level = ?";
            db.query(checkSql, [course, slo_code, level], (err, results) => {
                if (err) {
                    console.error(`Error checking mapping line ${index + 1}:`, err);
                    return;
                }

                if (results.length > 0) {
                    console.log(`Skipping duplicate mapping: ${course} → ${slo_code} (${level})`);
                    return;
                }

                const insertSql = `INSERT INTO course_slos (course, slo_code, level) VALUES (?, ?, ?)`;
                db.query(insertSql, [course, slo_code, level], (err) => {
                    if (err) {
                        console.error(`Error inserting mapping line ${index + 1}:`, err);
                    } else {
                        console.log(`Inserted mapping: ${course} → ${slo_code} (${level})`);
                        insertedMappings++;
                    }
                });
            });
        } else {
            console.warn(`Skipping invalid line ${index + 1}: ${line}`);
        }
    }
});

setTimeout(() => {
    console.log(`\nSummary:
- Inserted SLOs: ${insertedSLOs}
- Inserted course mappings: ${insertedMappings}
`);
    db.end();
}, 5000);