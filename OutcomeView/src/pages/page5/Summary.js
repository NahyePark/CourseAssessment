import { useNavigate } from "react-router-dom"
import "./Summary.css";
import { useEffect, useCallback } from "react";
import Table from "../../components/Table";
import Button from "../../components/Button";
import Histogram from "../../components/Histogram";
import TextInput from "../../components/TextInput";
import "../Pages.css";
import { useData } from "../DataContext";
//import generateLatex from "../GenerateLatex";
//import axios from "axios";

function Summary() {
    const navigate = useNavigate();
    const {data, updateData} = useData();

    const courseActivitiescolumns = [
        {name: "ID"},
        {name: "Course Activities supporting the PI"},
        {name: "Description"}
    ];

    const rubricColumns = [
        {name: "Course Activity"},
        {name: "Exemplary"},
        {name: "Satisfactory"},
        {name: "Developing"},
        {name: "Unsatisfactory"},
    ]

    const cumulativeColumns = [
        {name: "ID"},
        {name: "Exemplary"},
        {name: "Satisfactory"},
        {name: "Developing"},
        {name: "Unsatisfactory"},
    ]

    useEffect(() => {
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
        console.log(cumulativeNumberTable);
        const totals = extractedTable.reduce((acc, row) => ({
            Exemplary: acc.Exemplary + Number(row.Exemplary),
            Satisfactory: acc.Satisfactory + Number(row.Satisfactory),
            Developing: acc.Developing + Number(row.Developing),
            Unsatisfactory: acc.Unsatisfactory + Number(row.Unsatisfactory),
        }), { Exemplary: 0, Satisfactory: 0, Developing: 0, Unsatisfactory: 0 });

        const totalNumber = totals.Exemplary + totals.Satisfactory + totals.Developing + totals.Unsatisfactory;

        const attainmentRow = {
            ID: "Cumulative Attainment",
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
        console.log(data.cumulativeTable);
        
    }, []);

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
      }, [updateData]);


    const handleNextPage = () => {
        navigate(`/Download`);
    };

    const handlePrevPage = () => {
        updateData("dataAnalysis", "");
        const src = data.flowSource;
        if (src === "PICSV") {
            resetCsvState();
            navigate("/PICSV");
        } else {
            navigate("/Rubric");
        }
    };

    const onChangeTextInput = (e) => {
        updateData('dataAnalysis', e.target.value);
    }
    
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
                <Table className="table" columns={courseActivitiescolumns} data={data.piTable} />
            </div>

            <div className="table-container">
                <Table className="table" columns={rubricColumns} data={data.rubricTable}/>
            </div>

            <div className="option">
                <p className="item"><strong>Data Analysis</strong></p>
                <div className="table-container">
                    <Table className="table" columns={cumulativeColumns} data={data.cumulativeTable}/>
                </div>
            </div>

            {data.cumulativeTable.length > 0 ? (
            <div className="option">
                <p className="item"><strong>Generated histogram</strong></p>
                <div className="histogram-container">
                    <Histogram className="histogram" value={data.SLO} data={data.cumulativeTable[data.cumulativeTable.length - 1]} />
                </div>
            </div>): null}

            <div className="option">
                <p className="item"><strong>Data Analysis</strong></p>  
                <TextInput className="inputText" label="" placeholder="" value={data.dataAnalysis} onChange={onChangeTextInput}/>
            </div>

            <div className="submit-button">
                <Button text={"Previous"} onClick={handlePrevPage} className="prev-button"/>
                <Button text={"Submit"} onClick={handleNextPage} className="next-button"/>
            </div>

        </div>
    );
}

export default Summary;

