const express = require('express');
const mysql = require('mysql2/promise');

const router = express.Router();
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: 'password!',
    database: 'SLO_db'
};

router.get('/slos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        const [rows] = await connection.query('SELECT * FROM slos');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error fetching SLOs:', err);
        res.status(500).json({ error: 'Failed to fetch SLOs' });
    }
});

router.get('/course-slos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
		const [rows] = await connection.query('SELECT course, slo_code, level FROM course_slos');
		await connection.end();

		const grouped = {};

		rows.forEach(item => {
			if (!grouped[item.course]) {
				grouped[item.course] = [];
			}
			grouped[item.course].push({
				outcomeCode: item.slo_code,
				level: item.level
			});
		});

		res.json(grouped);
    } catch (err) {
        console.error('Error fetching course SLOs:', err);
        res.status(500).json({ error: 'Failed to fetch course SLOs' });
    }
});

router.get('/pis', async (req, res) => {
    try {
        const connection = await mysql.createConnection({
            ...dbConfig,
            database: 'PI_db'
        });
        const [rows] = await connection.query('SELECT * FROM pis');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error fetching PIs:', err);
        res.status(500).json({ error: 'Failed to fetch PIs' });
    }
});

router.get('/rubrics', async (req, res) => {
    try {
        const connection = await mysql.createConnection({
            ...dbConfig,
            database: 'rubric_db'
        });
        const [rows] = await connection.query('SELECT * FROM rubrics');
        await connection.end();
        res.json(rows);
    } catch (err) {
        console.error('Error fetching rubrics:', err);
        res.status(500).json({ error: 'Failed to fetch rubrics' });
    }
});

router.post('/save-rubrics', async (req, res) => {
    const rubrics = req.body;
	
	if (rubrics.length === 0) {
        return res.status(400).json({ success: false, error: 'No rubrics provided' });
    }
	
	const { course, semester, slo, level } = rubrics[0];
	
    let inserted = 0;
    let skipped = 0;

    try {
        const connection = await mysql.createConnection({
            ...dbConfig,
            database: 'rubric_db'
        });
		
		//To updates, remove existing one
		await connection.query(
            `DELETE FROM rubrics WHERE course = ? AND semester = ? AND slo = ? AND level = ?`,
            [course, semester, slo, level]
        );

        for (const rubric of rubrics) {
            const [result] = await connection.query(
                `INSERT IGNORE INTO rubrics (course, semester, slo, level, exercise, pi, description, unsatisfactory, developing, satisfactory, exemplary)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    rubric.course,
                    rubric.semester,
                    rubric.slo,
                    rubric.level,
                    rubric.exercise,
                    rubric.pi,
                    rubric.description,
                    rubric.unsatisfactory,
                    rubric.developing,
                    rubric.satisfactory,
                    rubric.exemplary
                ]
            );

            if (result.affectedRows === 1) {
                inserted++;
            } else {
                skipped++;
            }
        }

        await connection.end();
        res.json({ success: true, inserted, skipped, total: rubrics.length });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;