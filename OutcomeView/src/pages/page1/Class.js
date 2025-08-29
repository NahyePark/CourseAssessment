import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom"
import "./Class.css";
import "../Pages.css";
import Button from "../../components/Button"
import { fetchCourseSLOs } from "../../services/api";

function Class() {
    const [selectedClass, setSelectedClass] = useState("");
    const [courses, setCourses] = useState({});
    
    const [selectedSLO, setSelectedSLO] = useState("");
    const [selectedLevel, setSelectedLevel] = useState("");
    const navigate = useNavigate();
    

    useEffect(() => {
        const getData = async () => {
            
            const courseSloResult = await fetchCourseSLOs();
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

        /*
        if(selectedClass && selectedSLO && selectedLevel) {
            const desc = SLO[selectedSLO].description;
            updateData("selectedCourse", selectedClass);
            updateData("SLO", selectedSLO);
            updateData("level", selectedLevel);
            updateData("description", desc);
            navigate(`/SLO`);
        } 
        */
       navigate(`/SLO?course=${selectedClass}&slo=${selectedSLO}&level=${selectedLevel}`);


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
                    {selectedClass && Array.from(new Set(courses[selectedClass]?.map(item => item.outcomeCode))).map((code, index) => (
                        <option key={index} value={code}>{code || "UNKNOWN"}</option>
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

