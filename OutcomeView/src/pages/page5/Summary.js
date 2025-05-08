import { useNavigate } from "react-router-dom"
import "./Summary.css";
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

    const handleNextPage = () => {
        navigate(`/Download`);
    }

    const handlePrevPage = () => {
        updateData("dataAnalysis", "");
        navigate(`/Rubric`);
    }

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

            <div className="option">
                <p className="item"><strong>Generated histogram</strong></p>
                <div className="histogram-container">
                    <Histogram className="histogram" value={data.SLO} data={data.cumulativeTable[data.cumulativeTable.length - 1]} />
                </div>
            </div>

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

