import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react";
import "./PI.css";
import Table from "../../components/Table";
import Button from "../../components/Button";
import { fetchData } from "../../services/api";
import "../Pages.css";
import { useData } from "../DataContext";

function PI() {
    const navigate = useNavigate();

    const columns = [
        {name: "ID"},
        {name: "Course Activities supporting the PI", type: "textOrNumber"},
    ];

    const [prevActivities, setPrevActivities] = useState([]);

    const {data, updateData} = useData();

    const extractInfo = (text) => {
        const courseSections = text.split("================================================================================");
        for(let section of courseSections) {
            const lines = section.trim().split("\n");
            if(lines[0].trim().toLowerCase() === data.selectedCourse.toLowerCase()) {
                return lines.slice(2).filter(line => !line.startsWith('=')&& line.trim() !== '').map(line => line.replace(/^\s*-\s*/, ''));
            }
        }

        return ["No previous activities"];
    }

    useEffect(() => {
            const getData = async () => {
                const result = await fetchData("course.previous.activities.txt");
                if(result) {
                    const info = extractInfo(result);
                    setPrevActivities(info);
                }
            }
            getData();
        }, []);

    const handleDataChange = (newData) => {
        updateData("piTable", newData);
    };

    const handleNextPage = () => {
        const courseActivitiesArray = data.piTable.map(row => row["Course Activities supporting the PI"]);
        if(!courseActivitiesArray.includes("")) {
            const transformTable = data.piTable.flatMap(row =>
                row["Course Activities supporting the PI"].split(",").map(activity => ({
                    ID: row.ID,
                    "Performance Indicator": row["Performance Indicator"],
                    "Course Activities supporting the PI": activity.trim(),
                }))
            );
            updateData("piTable", transformTable);
            navigate(`/Rubric`);
        } else {
            alert("Please fill out the course activities.");
        }
    }

    return (
        <div className="class-container">
            <h1 className="item">Course <strong>{data.selectedCourse || "None"}</strong></h1>
            <p className="item">Student Learning Outcomes supported by this course: <strong>{data.SLO}</strong><br />{data.description}</p>
            <div className="option">
                <p className="item"><strong>Program Indicator</strong></p>
                {data.piTable.map((pi, index) => (
                    <p className="item" key={index}>PI{index+1} : {pi["Performance Indicator"]}</p>
                ))}
            </div>
            <div className="table-container">
                <Table className="table" columns={columns} data={data.piTable} onDataChange={handleDataChange} />
            </div>

            <div className="option">
                <p className="item"><strong>Previous year's course activities</strong></p>
                {prevActivities.map((activity, index) => (
                    <p className="item" key={index}>- {activity}</p>
                ))}
            </div>

            
            <div className="submit-button">
                <Button text={"Submit"} onClick={handleNextPage} className="next-button"/>
            </div>

        </div>
    );
}

export default PI;

