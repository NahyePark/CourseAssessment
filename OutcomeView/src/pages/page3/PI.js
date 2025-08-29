import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react";
import "./PI.css";
import Table from "../../components/Table";
import Button from "../../components/Button";
import { fetchRubrics } from "../../services/api";
import "../Pages.css";
import { useData } from "../DataContext";

function PI() {
    const navigate = useNavigate();

    const columns = [
        {name: "ID"},
        {name: "Course Activities supporting the PI", type: "textOrNumber"},
    ];

    const {data, updateData} = useData();

    useEffect(() => {
            const getData = async () => {
                const result = await fetchRubrics();

                if (result && result.length) {
                    const selectedCourse = data.selectedCourse.toLowerCase();

                    const resultsBySemester = {};

                    result
                    .filter(item => item.course.toLowerCase() === selectedCourse)
                    .forEach(item => {
                        const semester = item.semester;
                        if (!resultsBySemester[semester]) {
                            resultsBySemester[semester] = [];
                        }

                        resultsBySemester[semester].push({
                            course: item.course,
                            semester: item.semester,
                            slo: item.slo,
                            level: item.level,
                            exercise: item.exercise,
                            pi: item.pi,
                            description: item.description,
                            rubric: {
                                unsatisfactory: item.unsatisfactory,
                                developing: item.developing,
                                satisfactory: item.satisfactory,
                                exemplary: item.exemplary
                            }
                        });
                    });

                updateData("prevRubric", resultsBySemester);
            }
        };
            
            getData();
        }, []);

    const handleDataChange = (newData) => {
        updateData("courseActivities", newData);
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
            updateData("flowSource", "PI");
            navigate(`/Rubric`);
        } else {
            alert("Please fill out the course activities.");
        }
    }

    const handlePrevPage = () => {
        navigate(`/SLO?course=${data.selectedCourse}&slo=${data.SLO}&level=${data.level}`);

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

