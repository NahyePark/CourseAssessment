import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"
import "./Class.css";
import "../Pages.css";
import Button from "../../components/Button"
import { fetchSLOs, fetchCourseSLOs } from "../../services/api";
import { useData } from "../DataContext";

function Class() {
    const [selectedClass, setSelectedClass] = useState("");
    const [courses, setCourses] = useState({});
    const [SLO, setSLO] = useState({});
    const [selectedSLO, setSelectedSLO] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const navigate = useNavigate();
    const {updateData} = useData();

    useEffect(() => {
        const getData = async () => {
            const sloResult = await fetchSLOs();
            const courseSloResult = await fetchCourseSLOs();

            const sloMap = {};
            sloResult.forEach(item => {
                sloMap[item.code] = {
                    decription: item.decription,
                    semester: item.semester
                };
            });
            setSLO(sloMap);

            setCourses(courseSloResult);
        }
        getData();
    }, []);

    const handleSelectCourseChange = (event) => {
        setSelectedClass(event.target.value);
        setSelectedSLO(""); 
        setSelectedLevel(""); 
    };
    const handleSelectSLOChange = (event) => {
        setSelectedSLO(event.target.value);
        setSelectedLevel("");
    };
    const handleSelectLevelChange = (event) => {
        setSelectedLevel(event.target.value);
    };

    const handleNextPage = () => {
        if(!selectedClass)
            alert("Please select a class first.");
        if(!selectedSLO)
            alert("Please select a SLO.");
        if(!selectedLevel)
            alert("Please select a Level.");

        if(selectedClass && selectedSLO && selectedLevel) {
            const desc = SLO[selectedSLO].description;
            updateData("selectedCourse", selectedClass);
            updateData("SLO", selectedSLO);
            updateData("level", selectedLevel);
            updateData("description", desc);
            navigate(`/SLO`);
        } 
    }

    return (
        <div className="class-container">
            <h1 className="item">Select a Class</h1>
            <div className="item">
                <select value={selectedClass} onChange={handleSelectCourseChange} className="dropdown">
                    <option value="">-- Select Class --</option>
                    {Object.keys(courses).map((course, index) => (
                        <option key={index} value={course}>{course}</option>
                    ))}
                </select>
                <select value={selectedSLO} onChange={handleSelectSLOChange} className="dropdown">
                    <option value="">-- Select SLO --</option>
                    {selectedClass && courses[selectedClass]?.map((item, index) => (
                        <option key={index} value={item.outcomeCode}>{item.outcomeCode || "UNKNOWN"}</option>
                    ))}
                </select>
                <select value={selectedLevel} onChange={handleSelectLevelChange} className="dropdown">
                    <option value="">-- Select Level --</option>
                    {selectedClass && selectedSLO && 
                        courses[selectedClass]
                            .filter(item => item.outcomeCode === selectedSLO)
                            .map((item, index) => (
                                <option key={index} value={item.level}>{item.level}</option>
                            ))
                    }
                </select>
            </div>
            <div className="submit-button">
                <Button text={"Submit"} onClick={handleNextPage} className="next-button"/>
            </div>
        </div>

    );
}

export default Class;

