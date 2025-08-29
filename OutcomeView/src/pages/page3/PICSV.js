import { useNavigate } from "react-router-dom"
import { useState, useEffect, useMemo, useCallback } from "react";
import "./PI.css";
import Table from "../../components/Table";
import Button from "../../components/Button";
import CSVUploader from "../../components/CSVUploader";
import "../Pages.css";
import { useData } from "../DataContext";

function PICSV() {
    const navigate = useNavigate();

    const [columns, setColumns] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [activities, setActivities] = useState([]);

    const {data, updateData} = useData();

    const thresholdColumns = [
        { name: "PI", type: "label" },
        { name: "Section", type: "label" },
        { name: "Unsatisfactory", type: "textOrNumber" , readOnly: (row) => row.Section === "Counts" },
        { name: "Developing",     type: "textOrNumber" , readOnly: (row) => row.Section === "Counts" },
        { name: "Satisfactory",   type: "textOrNumber" , readOnly: (row) => row.Section === "Counts" },
        { name: "Exemplary",      type: "textOrNumber" , readOnly: (row) => row.Section === "Counts" },
    ];

    const buildThresholdRows = (piId, acts) => {
        const th = data.thresholdByPI?.[piId] || { unsat: 60, dev: 80, sat: 90, ex: 100 };
        
        const counts = { Unsatisfactory: 0, Developing: 0, Satisfactory: 0, Exemplary: 0 };
        if (Array.isArray(data.csvData) && data.csvData.length && acts?.length) {
            const w = getWeightsForPI(piId, acts); // 0~1
            for (const stu of data.csvData) {
            const sc = stu?.scores || {};
            let total = 0;
            acts.forEach(a => { total += (w[a] || 0) * (Number(sc[a]) || 0); });
            counts[classify(total, th)]++;
            }
        }
    
        return [
            {
            PI: piId,
            Section: "Cutoffs",
            Unsatisfactory: th.unsat,
            Developing: th.dev,
            Satisfactory: th.sat,
            Exemplary: th.ex,
            isNumberRow: true,   
            },
            {
            PI: piId,
            Section: "Counts",
            Unsatisfactory: counts.Unsatisfactory,
            Developing: counts.Developing,
            Satisfactory: counts.Satisfactory,
            Exemplary: counts.Exemplary,
            isNumberRow: true,   //readOnly
            },
        ];
    };

    // update the table when csv file data is changed
    useEffect(() => {
        const cols = [
            { name: "PI", type: "label" },
            ...activities.map((activity) => ({
                name: activity,
                type: (row) => (row.rowType === "meta" ? "textOrNumber" : "checkbox"),
            })),
            ];

        const shortRow = {
            rowType: "meta",
            section: "short",
            PI: "Short Name",
            ...Object.fromEntries(activities.map((a) => [a, data.activityVars?.[a] ?? ""])),
            isNumberRow: false,
            };
            const descRow = {
            rowType: "meta",
            section: "desc",
            PI: "Description",
            ...Object.fromEntries(activities.map((a) => [a, data.activityDescs?.[a] ?? ""])),
            isNumberRow: false,
            };

        const table = (data.courseActivities || []).map((piObj) => {
            const prev = (data.CourseActivities || []).find((r) => r.rowType === "pi" && r.PI === piObj.ID);
            const row = { rowType: "pi", PI: piObj.ID };
            activities.forEach((activity) => {
                row[activity] = prev ? !!prev[activity] : false;
            });
            return row;
            });

        setColumns(cols);
        setTableData([shortRow, descRow, ...table]);

    }, [data.csvData, activities]);

    
    // mapping the PI according to checkbox
    const selectedByPI = useMemo(() => {
        const map = {};
        for (const row of tableData) {

          if (row?.rowType == "meta") continue;
          const piId = row.PI;
          map[piId] = activities.filter((act) => !!row[act]);
        }

        return map; 
    }, [tableData, activities]);

    // set default thresholds for each PI
    useEffect(() => {
        if (!selectedByPI) return;
        const next = { ...(data.thresholdByPI || {}) };
        let changed = false;
      
        Object.keys(selectedByPI).forEach((piId) => {
          const key = String(piId);
          if (!next[key]) {
            next[key] = { unsat: 60, dev: 80, sat: 90, ex: 100 };
            changed = true;
          }
        });
      
        if (changed) updateData("thresholdByPI", next);
      }, [selectedByPI, updateData, data.thresholdByPI]);


    // mapping the short names of the first table
    const shortMap = useMemo(() => {
        const row = tableData.find(r => r.rowType === "meta" && r.section === "short");
        const map = {};
        if (row) activities.forEach(a => map[a] = row[a] || a);
        return map;
      }, [tableData, activities]);

    const buildFormulaColumns = useCallback((acts) => {
    const last = acts[acts.length - 1]; 
    return [
        { name: "PI", type: "label" },
        { name: "Description", type: "textOrNumber", cellKind: "text" }, 
        ...acts.map(a => ({
        name: a,
        header: `${shortMap[a] || a} Weight`, 
        type: "textOrNumber",
        cellKind: "number", 
        readOnly: () => a === last,
        })),
    ];
    }, [shortMap]);

    // Find PI text using pi Id
    const getPIText = (piId) =>
        (data.courseActivities || [])
          .find(p => String(p.ID) === String(piId))?.["Performance Indicator"] || `PI ${piId}`;
    
    const classify = (score, th) => {
        const { unsat, dev, sat, ex } = th;
        if (score <= unsat) return "Unsatisfactory";
        if (score <= dev)   return "Developing";
        if (score <= sat)   return "Satisfactory";
        return "Exemplary";
    };

    // To show the number of students in live
    const getWeightsForPI = (piId, acts) => {
        const manual = data.formulaByPI?.[piId]?.weights || {};
        if (!acts?.length) return {};
        if (acts.length === 1) return { [acts[0]]: 1.0 };
        const sumOthers = acts.slice(0, -1).reduce((s, a) => s + (Number(manual[a]) || 0), 0);
        const last = Math.max(0, +(1 - sumOthers).toFixed(4));
        const w = {};
        acts.forEach((a, idx) => { w[a] = (idx === acts.length - 1) ? last : (Number(manual[a]) || 0); });
        return w;
    };


    // Description for rubric table(description for exeplary, satisfactory, developing, unsatisfactory)
    const formatWeightsPct = (weights, acts) =>
        acts.map(a => `${Math.round((weights[a] || 0) * 100)}% ${a}`).join(" + ");
      
    const buildLevelTexts = (piId, acts, shortMap) => {
        const th = data.thresholdByPI?.[piId] || { unsat: 60, dev: 80, sat: 90, ex: 100 };
        const w  = getWeightsForPI(piId, acts);
        const wText = formatWeightsPct(w, acts);
        return {
            Unsatisfactory: `The weighted result of ${wText} is ≤ ${th.unsat}.`,
            Developing:     `The weighted result of ${wText} is > ${th.unsat} and ≤ ${th.dev}.`,
            Satisfactory:   `The weighted result of ${wText} is > ${th.dev} and ≤ ${th.sat}.`,
            Exemplary:      `The weighted result of ${wText} is > ${th.sat} and ≤ ${th.ex}.`,
        };
    };

    // count the number of students for PI
    const countByPI = (piId, acts) => {
        const th = data.thresholdByPI?.[piId];
        const counts = { Unsatisfactory: 0, Developing: 0, Satisfactory: 0, Exemplary: 0 };
        if (!th || !Array.isArray(data.csvData) || !data.csvData.length || !acts?.length) return counts;
      
        const w = getWeightsForPI(piId, acts);
        for (const stu of data.csvData) {
          const sc = stu?.scores || {};
          let total = 0;
          acts.forEach(a => { total += (w[a] || 0) * (Number(sc[a]) || 0); });
          counts[classify(total, th)]++;
        }
        return counts;
    };

    // formula
    const buildFormulaRows = (piId, acts) => {
        const weightsDec = data.formulaByPI?.[piId]?.weights || {}; // 0-1
        // weight to percentage(0.3 -> 30)
        const manualPct = acts.map(a => {
            const v = Number(weightsDec[a] ?? 0) * 100;
            return Number.isFinite(v) ? Math.round(Math.max(0, Math.min(100, v))) : 0;
        });

        // last = 100 - rest
        const sumOthers = manualPct.slice(0, acts.length - 1)
            .reduce((s, x) => s + (Number.isFinite(x) ? x : 0), 0);
        const lastPct = Math.max(0, 100 - sumOthers);

        return [
            {
            PI: piId,
            Description: (data.piDescriptions?.[piId] ?? ""),
            ...Object.fromEntries(
                acts.map((a, idx) => [a, idx === acts.length - 1 ? lastPct : (manualPct[idx] ?? 0)])
            ),
            isNumberRow: false,
            },
        ];
    };

    const handleFormulaChange = (piId, acts, newRows) => {
        const row = newRows[0] || {};
        
        const nextDesc = { ...(data.piDescriptions || {}) };
        nextDesc[piId] = String(row.Description ?? "");
        updateData("piDescriptions", nextDesc);

        // store the wieght in range 0-1
        const clampPct = (v) => {
        const n = Number(v);
            return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
        };
        const nextW = {};
        acts.forEach((a, idx) => {
          if (idx < acts.length - 1) {
            nextW[a] = clampPct(row[a]) / 100;
            }
        });
        const next = { ...(data.formulaByPI || {}) };
        next[piId] = {
          ...(data.formulaByPI?.[piId] || {}),
          weights: { ...(data.formulaByPI?.[piId]?.weights || {}), ...nextW },
        };
        updateData("formulaByPI", next);
    };

    const handleThresholdChange = (piId, newRows) => {
        const r = newRows[0] || {};
        const next = { ...(data.thresholdByPI || {}) };
        next[piId] = {
          unsat: Number(r.Unsatisfactory) || 0,
          dev:   Number(r.Developing)     || 0,
          sat:   Number(r.Satisfactory)   || 0,
          ex:    Number(r.Exemplary)      || 0,
        };
        updateData("thresholdByPI", next);
    };

    const handleDataChange = (newData) => {
        const short = newData.find((r) => r.rowType === "meta" && r.section === "short") || {};
        const desc  = newData.find((r) => r.rowType === "meta" && r.section === "desc") || {};

        const nextVars  = { ...(data.activityVars || {}) };
        const nextDescs = { ...(data.activityDescs || {}) };
        activities.forEach((a) => {
            nextVars[a]  = short[a] ?? "";
            nextDescs[a] = desc[a] ?? "";
        });
        updateData("activityVars", nextVars);
        updateData("activityDescs", nextDescs);

        updateData("CourseActivities", newData);
        setTableData(newData);
    };

    // put activities in same PI with (,). activity1, activity2
    const formatActivitiesLabel = (acts) => acts.filter(Boolean).map(a => String(a).trim()).join(", ");

    const handleNextPage = () => {
        const shortRow = tableData.find(r => r.rowType === "meta" && r.section === "short") || {};
        const descRow  = tableData.find(r => r.rowType === "meta" && r.section === "desc")  || {};

        //check the empty cells of course acitivity table 
        const missingShort = activities.filter(a => !String(shortRow[a] ?? "").trim());
        if (missingShort.length) {
            alert(`Please enter Short Name for: ${missingShort.join(", ")}`);
            return;
        }
        const missingDesc = activities.filter(a => !String(descRow[a] ?? "").trim());
        if (missingDesc.length) {
            alert(`Please enter Description for: ${missingDesc.join(", ")}`);
            return;
        }

        //check the empty cells of weight and threshold table 
        const piRows = tableData.filter(r => r.rowType === "pi");
        const getPIText = (piId) =>
            (data.courseActivities || [])
            .find(p => String(p.ID) === String(piId))?.["Performance Indicator"]
            || `PI ${piId}`;

        for (const row of piRows) {
            const piId = row.PI;

            //should select at least one activity
            const selectedActs = activities.filter(a => row[a] === true);
            if (selectedActs.length === 0) {
                alert(`Please select at least one activity for ${piId}.`);
                return;
            }

            //check the sum of the weights
            if (selectedActs.length > 1) {
                const weights = data.formulaByPI?.[piId]?.weights || {};
                const sumOthers = selectedActs.slice(0, -1).reduce((s, a) => s + (Number(weights[a]) || 0), 0);
                if (sumOthers > 1 + 1e-8) {
                    alert(`Weights for ${piId} exceed 100. Reduce the first ${selectedActs.length - 1} weights.`);
                    return;
                }
            }

            //threshold should be in increasing order
            const th = data.thresholdByPI?.[piId];
            if (!th) {
                alert(`Please set cutoffs for ${piId}.`);
                return;
            }
            const { unsat, dev, sat, ex } = th;
            const vals = [unsat, dev, sat, ex].map(Number);
            if (vals.some(v => !Number.isFinite(v))) {
                alert(`Cutoffs for ${piId} must be numbers.`);
                return;
            }
            if (!(unsat < dev && dev < sat && sat <= ex)) {
                alert(`Cutoffs for ${piId} must be increasing: Unsatisfactory < Developing < Satisfactory ≤ Exemplary.`);
                return;
            }

            ////////// Create rubric table and PI table for Summary page

            // only selected activities
            const entries = Object.entries(selectedByPI).filter(([, acts]) => acts.length > 0);

            // add pi descriptions to the piTable
            const piTable = entries.map(([piId, acts]) => ({
                ID: piId,
                "Performance Indicator": getPIText(piId),
                "Course Activities supporting the PI": formatActivitiesLabel(acts),   
                Description: (data.piDescriptions?.[piId] ?? ""), 
            }));

            // build rubricTable with the generated description and counts
            const rubricTable = entries.flatMap(([piId, acts]) => {
                const piText = getPIText(piId);
                const label = formatActivitiesLabel(acts);
                const texts = buildLevelTexts(piId, acts);  
                const counts = countByPI(piId, acts);                       

                return [
                    {
                        "Course Activity": label,
                        Exemplary:   texts.Exemplary,
                        Satisfactory:texts.Satisfactory,
                        Developing:  texts.Developing,
                        Unsatisfactory: texts.Unsatisfactory,
                        PI: piText,
                        Description: "",                 
                        isNumberRow: false,
                    },
                    {
                        "Course Activity": label,
                        Exemplary:   counts.Exemplary,
                        Satisfactory:counts.Satisfactory,
                        Developing:  counts.Developing,
                        Unsatisfactory: counts.Unsatisfactory,
                        PI: piText,
                        Description: "",                 
                        isNumberRow: true,
                    },
                ];
            });

            updateData("piTable", piTable);
            updateData("rubricTable", rubricTable);
        
        };

        updateData("flowSource", "PICSV");
        navigate("/Summary");
    }

    // reset current data before go to previous page
    const resetCsvState = useCallback(() => {
        updateData("csvData", []);
        updateData("CourseActivities", []);
        updateData("activityVars", {});
        updateData("activityDescs", {});
        updateData("formulaByPI", {});
        updateData("thresholdByPI", {});    
        updateData("piDescriptions", {}); 
        updateData("piTable", []);
        updateData("rubricTable", []);
        updateData("flowSource", "");
      
        setColumns([]);
        setTableData([]);
        setActivities([]);
      }, [updateData]);

    const handlePrevPage = () => {
        resetCsvState();
        navigate(`/SLO?course=${data.selectedCourse}&slo=${data.SLO}&level=${data.level}`);
    }

    const handleParsedData = (parsedData) => {
        updateData("csvData", parsedData);

        const allKeys = Object.keys(parsedData[0].scores || {}); 
        const currActivities = allKeys.filter(
                (key) => key !== "login" && key !== "final grade"
            );
        setActivities(currActivities);

        // default short name: A, B, C...
        const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        const varsDefault = Object.fromEntries(currActivities.map((a, i) => [a, (data.activityVars?.[a]) ?? (letters[i] || `V${i+1}`)]));
        const descDefault = Object.fromEntries(currActivities.map((a) => [a, data.activityDescs?.[a] ?? ""]));
        updateData("activityVars", { ...(data.activityVars || {}), ...varsDefault });
        updateData("activityDescs", { ...(data.activityDescs || {}), ...descDefault });
    };

    return (
        <div className="class-container">
            <h1 className="item">Course <strong>{data.selectedCourse || "None"}</strong></h1>
            <p className="item">Student Learning Outcomes supported by this course: <strong>{data.SLO}</strong><br />{data.description}</p>
            <div className="option">
                <p className="item"><strong>Performance Indicator</strong></p>
                {data.courseActivities.map((pi, index) => (
                    <p className="item" key={index}>PI{index+1} : {pi["Performance Indicator"]}</p>
                ))}
            </div>
            <div className="item">
                <CSVUploader onParsed={handleParsedData} />
            </div>
            <div className="table-container">
                {data.csvData.length > 0 ? 
                    <Table className="table" columns={columns} data={tableData} onDataChange={handleDataChange} /> 
                    : null}
            </div>
            
            {/*Weight and threshold table for each PI*/}
            {data.csvData.length > 0 ? Object.entries(selectedByPI).map(([piId, acts]) => {
                const piText = (data.courseActivities || [])
                .find(p => String(p.ID) === String(piId))?.["Performance Indicator"];
            
              return (
                <div className="item">
                    <div key={piId} style={{ marginTop: 24 }}>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                            <h3 style={{ margin: 0 , fontSize: '1.1rem'}}>{piId}</h3>
                            <p style={{ margin: 0}}>{piText}</p>
                        </div>

                        {acts.length > 0 ? (
                        <>
                            {/* weight table */}
                            <Table
                            className="table"
                            columns={buildFormulaColumns(acts)}
                            data={buildFormulaRows(piId, acts)}
                            onDataChange={(rows) => handleFormulaChange(piId, acts, rows)}
                            tableWidth="90%"
                            inputHeight="36px"
                            inputFontSize="14px"
                            />

                            {/* threshold table */}
                            <div style={{ marginTop: 12 }} />
                            <Table
                            className="table"
                            columns={thresholdColumns}
                            data={buildThresholdRows(piId, acts)}
                            onDataChange={(rows) => handleThresholdChange(piId, rows)}
                            tableWidth="90%"
                            inputHeight="36px"
                            inputFontSize="14px"
                            />
                        </>
                        ) : (
                        <div style={{ fontSize: 14, opacity: 0.7 }}>No activities selected.</div>
                        )}
                    </div>
                </div>
              );
            }) : null}
            
            <div className="submit-button">
                <Button text={"Previous"} onClick={handlePrevPage} className="prev-button"/>
                <Button text={"Submit"} onClick={handleNextPage} className="next-button"/>
            </div>

        </div>
    );
}

export default PICSV;

