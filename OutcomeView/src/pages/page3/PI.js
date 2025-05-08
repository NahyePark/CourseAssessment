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

    const {data, updateData} = useData();

    const extractInfo = (text) => {
        const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
        const results = {}; // { semester: [rubric1, rubric2, ...] }
        let i = 0;

        while (i < lines.length) {
            if (lines[i].startsWith("DB:")) {
                i++;
                continue;
            }
    
            const course = lines[i++].toLowerCase();
            const semester = lines[i++];
            const slo = lines[i++];
            const level = lines[i++];
            const exercise = lines[i++];
            const pi = lines[i++];
            const description = lines[i++];
            const unsatisfactory = lines[i++];
            const developing = lines[i++];
            const satisfactory = lines[i++];
            const exemplary = lines[i++];
    
            if (course === data.selectedCourse.toLowerCase()) {
                if (!results[semester]) {
                    results[semester] = [];
                }
    
                results[semester].push({
                    course,
                    semester,
                    slo,
                    level,
                    exercise: exercise.replace(/(^"|"$)/g, ""),
                    pi: pi.replace(/(^"|"$)/g, ""),
                    description: description.replace(/(^"|"$)/g, ""),
                    rubric: {
                        unsatisfactory: unsatisfactory.replace(/(^"|"$)/g, ""),
                        developing: developing.replace(/(^"|"$)/g, ""),
                        satisfactory: satisfactory.replace(/(^"|"$)/g, ""),
                        exemplary: exemplary.replace(/(^"|"$)/g, ""),
                    }
                });
            }
        }
    
        return results; // { "F24": [...], "S24": [...], ... }

    }

    useEffect(() => {
            const getData = async () => {
                const result = await fetchData("rubrics-db.txt");
                if(result) {
                    const info = extractInfo(result);
                    updateData("prevRubric", info);
                }
            }

            getData();
        }, []);

    const handleDataChange = (newData) => {
        updateData("CourseActivities", newData);
    };

    const handleNextPage = () => {
        const courseActivitiesArray = data.courseActivities.map(row => row["Course Activities supporting the PI"]);
        if(!courseActivitiesArray.includes("")) {
            const transformTable = data.courseActivities.flatMap(row =>
                row["Course Activities supporting the PI"].split(",").map(activity => ({
                    ID: row.ID,
                    "Performance Indicator": row["Performance Indicator"],
                    "Course Activities supporting the PI": activity.trim(),
                    "Description": "",
                }))
            );
            console.log(transformTable);
            updateData("piTable", transformTable);

            navigate(`/Rubric`);
        } else {
            alert("Please fill out the course activities.");
        }
    }

    const handlePrevPage = () => {
        navigate("/SLO");

    }

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
            <div className="table-container">
                <Table className="table" columns={columns} data={data.courseActivities} onDataChange={handleDataChange} />
            </div>

            <div className="option">
                <p className="item"><strong>Previous year's course activities</strong></p>
                {Object.keys(data.prevRubric).map((semester) => (
                    <div key={semester} className="item">
                        <h>{semester}</h> 
                        <ul>
                            {data.prevRubric[semester].map((entry, index) => (
                                <li key={index}>{entry.exercise}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            
            <div className="submit-button">
                <Button text={"Previous"} onClick={handlePrevPage} className="prev-button"/>
                <Button text={"Submit"} onClick={handleNextPage} className="next-button"/>
            </div>

        </div>
    );
}

export default PI;

