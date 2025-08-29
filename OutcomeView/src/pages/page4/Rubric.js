import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react";
import "./Rubric.css";
import Table from "../../components/Table";
import Button from "../../components/Button";
import "../Pages.css";
import { useData } from "../DataContext";
import { fetchData } from "../../services/api";

function Rubric() {
    const navigate = useNavigate();
    const {data, updateData} = useData();
    const [prevRubic, setPrevRubric] = useState({});
    const [selectedSemester, setSelectedSemester] = useState("");


    const courseActivitiescolumns = [
        {name: "ID"},
        {name: "Course Activities supporting the PI"},
        {name: "Description", type: "textOrNumber"},
    ];

    const rubricColumns = [
        {name: "Course Activity"},
        {name: "Exemplary", type: "textOrNumber"},
        {name: "Satisfactory", type: "textOrNumber"},
        {name: "Developing", type: "textOrNumber"},
        {name: "Unsatisfactory", type: "textOrNumber"},
    ];

    const prevRubricColumn = [
        {name: "Course Activity"},
        {name: "PI"},
        {name: "Description"},
        {name: "SLO"},
        {name: "Exemplary"},
        {name: "Satisfactory"},
        {name: "Developing"},
        {name: "Unsatisfactory"},
    ];


    const extractInfo = (text) => {
        const courseSections = text.split("================================================================================");
        for(let section of courseSections) {
            const lines = section.trim().split("\n");
            if(lines[0].trim().toLowerCase() === data.selectedCourse.toLowerCase()) {
                const result = {};
                let currentCategory = null;
                for (let line of lines) {
                    const cleanedLine = line.trim().replace(/\s+:/, ":");
                    const categoryMatch = cleanedLine.match(/^(.+):$/);
                    if (categoryMatch) {
                        currentCategory = categoryMatch[1];
                        result[currentCategory] = []; 
                    } else if (cleanedLine.startsWith("-") && currentCategory) {
                        result[currentCategory].push(cleanedLine.substring(1).trim()); 
                    }
                }
                return result;
            }
        }

        return {"No previous rubric":[]};
    }
    

    useEffect(() => {
        if(!data.rubricTable || data.rubricTable.length === 0) {
            const rubricTable = data.piTable.flatMap((pi) => ([
                { "Course Activity": pi["Course Activities supporting the PI"], 
                    Exemplary: "", Satisfactory: "", 
                    Developing: "", Unsatisfactory: "" , 
                    PI: pi["Performance Indicator"],
                    Description: pi["Description"],
                    isNumberRow: false},
                { "Course Activity": pi["Course Activities supporting the PI"], 
                    Exemplary: 0, Satisfactory: 0, 
                    Developing: 0, Unsatisfactory: 0 , 
                    PI: pi["Performance Indicator"],
                    Description: pi["Description"],
                    isNumberRow: true}
            ]));
            updateData("rubricTable", rubricTable);
        }
    }, [data.piTable])

    /*
    useEffect(() => {
        const getData = async () => {
            const result = await fetchData("course.previous.rubric.txt");
            if(result) {
                const info = extractInfo(result);
                setPrevRubric(info);
            }
        }
        getData();
    }, []);
    */
    const handleRubricDataChange = (newData) => {
        updateData("rubricTable", newData);
    };

    const handlePIDataChange = (newData) => {
        updateData("piTable", newData);
    }

    const hasEmptyCells = (data, columns) => {
        for (const row of data) {
            for (const col of columns) {
                if (!row[col.name]?.toString().trim()) {
                    return true; 
                }
            }
        }
        return false; 
    };

    const handleNextPage = () => {
        if(hasEmptyCells(data.piTable, courseActivitiescolumns) || hasEmptyCells(data.rubricTable, rubricColumns))
            alert("Please fill out all cells in the table");
        else
        {
            //update the rubric with descriptions
            const updatedRubricTable = data.rubricTable.map(row => {
                const matchingPI = data.piTable.find(
                    pi => pi["Course Activities supporting the PI"] === row["Course Activity"] &&
                            pi["Performance Indicator"] === row.PI
                );
                return {
                    ...row,
                    Description: matchingPI?.Description || ""
                };

            });
        
            updateData("rubricTable", updatedRubricTable);
/*
            // calculate a cumulative table
            const extractedTable = data.rubricTable.filter(row => row.isNumberRow);
            let cumulativeNumberTable = extractedTable.map((row) => (
                {
                    ID: row["Course Activity"], 
                    Exemplary: row.Exemplary,
                    Satisfactory: row.Satisfactory,
                    Developing: row.Developing,
                    Unsatisfactory: row.Unsatisfactory,
                }
            ));

            const totals = extractedTable.reduce((acc, row) => ({
                Exemplary: acc.Exemplary + Number(row.Exemplary),
                Satisfactory: acc.Satisfactory + Number(row.Satisfactory),
                Developing: acc.Developing + Number(row.Developing),
                Unsatisfactory: acc.Unsatisfactory + Number(row.Unsatisfactory),
            }), { Exemplary: 0, Satisfactory: 0, Developing: 0, Unsatisfactory: 0 });

            const totalNumber = totals.Exemplary + totals.Satisfactory + totals.Developing + totals.Unsatisfactory;

            const attainmentRow = {
                ID: "Cumulative Attaiment",
                Exemplary: totals.Exemplary,
                Satisfactory: totals.Satisfactory,
                Developing: totals.Developing,
                Unsatisfactory: totals.Unsatisfactory,
            };

            const levelAttainmentRow = {
                ID: `Level of Attainment for ${data.SLO}`,
                Exemplary: `${(totals.Exemplary / totalNumber * 100.0).toFixed(2)}%`,
                Satisfactory: `${(totals.Satisfactory / totalNumber * 100.0).toFixed(2)}%`,
                Developing: `${(totals.Developing / totalNumber * 100.0).toFixed(2)}%`,
                Unsatisfactory: `${(totals.Unsatisfactory / totalNumber * 100.0).toFixed(2)}%`,
            };

            cumulativeNumberTable = [...cumulativeNumberTable, attainmentRow, levelAttainmentRow];

            updateData("cumulativeTable", cumulativeNumberTable);*/
            navigate(`/Summary`);
        } 
    }

    const handlePrevPage = () => {
         updateData({
            rubricTable: [],
          });

        navigate("/PI");

    }

    const createRubricTableData = (rubricEntries) => {
        return rubricEntries.map(entry => ({
            "Course Activity": entry.exercise,
            "PI": entry.pi,
            "Description": entry.description,
            "SLO": entry.slo + ' ' + entry.level,
            "Exemplary": entry.rubric.exemplary,
            "Satisfactory": entry.rubric.satisfactory,
            "Developing": entry.rubric.developing,
            "Unsatisfactory": entry.rubric.unsatisfactory,
        }));
    };

    return (
        <div className="class-container">
            <h1 className="item">Course <strong>{data.selectedCourse || "None"}</strong></h1>
            <p className="item">Student Learning Outcomes supported by this course: <strong>{data.SLO}</strong><br />{data.description}</p>
            <div className="option">
                <p className="item"><strong>Performance Indicator</strong></p>
                {data.piTable
                    .filter((pi, index, self) => 
                        index === self.findIndex((p) => p.ID === pi.ID)
                    )
                    .map((pi, index) => (
                        <p className="item" key={index}>
                            {pi["ID"]} : {pi["Performance Indicator"]}
                        </p>
                    ))
                }
            </div>

            <div className="table-container">
                <Table className="table" columns={courseActivitiescolumns} data={data.piTable} onDataChange={handlePIDataChange} />
            </div>

            <div className="table-container">
                <Table className="table" columns={rubricColumns} data={data.rubricTable} onDataChange={handleRubricDataChange}/>
            </div>

            <div className="option">
                <p className="item"><strong>Previous year's rubric</strong></p>
                <select 
                    value={selectedSemester} 
                    onChange={(e) => setSelectedSemester(e.target.value)} 
                    className="item"
                >
                    <option value="">-- Select Semester --</option>
                    {Object.keys(data.prevRubric).map((semester, index) => (
                        <option key={index} value={semester}>
                            {semester}
                        </option>
                    ))}
                </select>
                <div className="table-container">
                    {selectedSemester && data.prevRubric[selectedSemester] && (
                        <Table
                            className="table"
                            columns={prevRubricColumn}
                            data={createRubricTableData(data.prevRubric[selectedSemester])}
                            
                        />
                        )}
                </div>
            </div>

            <div className="submit-button">
                <Button text={"Previous"} onClick={handlePrevPage} className="prev-button"/>
                <Button text={"Submit"} onClick={handleNextPage} className="next-button"/>
            </div>

        </div>
    );
}

export default Rubric;

