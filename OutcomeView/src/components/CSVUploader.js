import React, { useState } from "react";
import Papa from "papaparse";

function CSVUploader({ onParsed }) {
  const [fileName, setFileName] = useState("");

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      transformHeader: h => h.trim(),
      complete: ({ data: rows }) => {
        const toKey = (s) => String(s ?? "").trim().toLowerCase();
        const META_KEYS = new Set(["login", "name", "email", "student id"]);

        const pickId = (row) => {
          // priority: login > name > email > student id
          const id =
            row.login ?? row.Login ??
            row.name ?? row.Name ??
            row.email ?? row.Email ??
            row["student id"] ?? row["Student ID"];
          return String(id ?? "").trim();
        };
    
        const toNumber = (v) => {
          const n = parseFloat(String(v ?? "").replace(/[%\s,]+/g, ""));
          return Number.isFinite(n) ? n : 0; 
        };


        const studentScores = rows
          .filter(r => Object.values(r).some(v => String(v ?? "").trim() !== "")) // 완전 빈 행 제거
          .map((row) => {
            const login = pickId(row);  
            const scores = Object.fromEntries(
              Object.entries(row)
                .filter(([k]) => !META_KEYS.has(toKey(k)))
                .map(([k, v]) => [String(k).trim(), toNumber(v)])
            );
            return { login, scores };
        });

        console.log("Parsed studentScores:", studentScores);
        onParsed(studentScores); 
      },
      error: (err) => {
        console.error("CSV parsing error:", err);
      },
    });
  };

  return (
    <div>
      <label htmlFor="csv-upload">Upload CSV File </label>
      <input
        type="file"
        id="csv-upload"
        accept=".csv"
        onChange={handleFileChange}
      />
      {fileName && <p>Selected: <strong>{fileName}</strong></p>}
    </div>
  );
}

export default CSVUploader;