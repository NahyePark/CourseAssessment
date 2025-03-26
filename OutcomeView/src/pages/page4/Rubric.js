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


    const courseActivitiescolumns = [
        {name: "ID"},
        {name: "Course Activities supporting the PI"},
    ];

    const rubricColumns = [
        {name: "Course Activity"},
        {name: "Exemplary", type: "textOrNumber"},
        {name: "Satisfactory", type: "textOrNumber"},
        {name: "Developing", type: "textOrNumber"},
        {name: "Unsatisfactory", type: "textOrNumber"},
    ]


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
                    console.log(categoryMatch);
                    if (categoryMatch) {
                        currentCategory = categoryMatch[1];
                        console.log(currentCategory); 
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
        if(data.rubricTable.length === 0) {
            const rubricTable = data.piTable.flatMap((pi) => ([
                { "Course Activity": pi["Course Activities supporting the PI"], Exemplary: "", Satisfactory: "", Developing: "", Unsatisfactory: "" , isNumberRow: false},
                { "Course Activity": pi["Course Activities supporting the PI"], Exemplary: 0, Satisfactory: 0, Developing: 0, Unsatisfactory: 0 , isNumberRow: true}
            ]));
            updateData("rubricTable", rubricTable);
        }
    }, [data, updateData])

    useEffect(() => {
            const getData = async () => {
                const result = await fetchData("course.previous.rubric.txt");
                if(result) {
                    const info = extractInfo(result);
                    console.log(info);
                    setPrevRubric(info);
                }
            }
            getData();
        }, []);

    const handleDataChange = (newData) => {
        updateData("rubricTable", newData);
    };

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
        if(!hasEmptyCells(data.rubricTable, rubricColumns)) {
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

            updateData("cumulativeTable", cumulativeNumberTable);
            navigate(`/Summary`);
        } else {
            alert("Please fill out all cells in the table");
        }
    }

    return (
        <div className="class-container">
            <h1 className="item">Course <strong>{data.selectedCourse || "None"}</strong></h1>
            <p className="item">Student Learning Outcomes supported by this course: <strong>{data.SLO}</strong><br />{data.description}</p>
            <div className="option">
                <p className="item"><strong>Program Indicator</strong></p>
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
                <Table className="table" columns={courseActivitiescolumns} data={data.piTable} />
            </div>

            <div className="table-container">
                <Table className="table" columns={rubricColumns} data={data.rubricTable} onDataChange={handleDataChange}/>
            </div>

            <div className="option">
                <p className="item"><strong>Previous year's rubric</strong></p>
                {Object.entries(prevRubic).map(([category, items]) => (
                <div key={category} style={{ marginBottom: "20px", marginLeft: "40px" }}>
                    <h5>{category}</h5>
                    <ul>
                        {items.map((item, index) => (
                            <li key={index}>{item}</li>
                        ))}
                    </ul>
                </div>
            ))}
            </div>

            <div className="submit-button">
                <Button text={"Submit"} onClick={handleNextPage} className="next-button"/>
            </div>

        </div>
    );
}

export default Rubric;

