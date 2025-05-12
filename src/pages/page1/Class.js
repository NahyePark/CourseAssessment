import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"
import "./Class.css";
import "../Pages.css";
import Button from "../../components/Button"
import { fetchData } from "../../services/api";
import { useData } from "../DataContext";

function Class() {
    const [selectedClass, setSelectedClass] = useState("");
    const [courses, setCourses] = useState({});
    const [SLO, setSLO] = useState({});
    const [selectedSLO, setSelectedSLO] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const navigate = useNavigate();
    const {updateData} = useData();

    const extractInfo = (text) => {
        const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
        const outcomes={};
        const courses={};

        let inOutcomeSection = true;

        lines.forEach(line => {
            if(inOutcomeSection) {
                const match = line.match(/^(CS\d+)\s+"(.+?)"\s+(\w+)$/);
                if (match) {
                    const [_, code, description, semester] = match;
                    outcomes[code] = {
                        description,
                        semester
                    };
                } else {
                    inOutcomeSection = false;
                }
            }

            if (!inOutcomeSection)
            {
                const parts = line.split(/\s+/);
                if (parts.length === 3) {
                    const [courseCode, outcomeCode, level] = parts;
                    if (!courses[courseCode]) {
                        courses[courseCode] = [];
                    }
                    courses[courseCode].push({ outcomeCode, level });
                }
            }
        });

        return {outcomes, courses};
    }

    useEffect(() => {
        const getData = async () => {
            const result = await fetchData("SLO-db.txt");
            if(result) {
                const info = extractInfo(result);
                setSLO(info.outcomes);
                setCourses(info.courses);
            }
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
                <select value={selectedSLO} onChange={handleSelectLevelChange} className="dropdown">
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

