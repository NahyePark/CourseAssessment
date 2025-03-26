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
    const navigate = useNavigate();
    const {updateData} = useData();

    const extractInfo = (text) => {
        const lines = text.split("\n");
        const outcomes={};
        const courses={};

        lines.forEach(line => {
            if(line.includes(":")) {
                const [courseCode, outcomeCode] = line.split(":").map(item => item.trim());
                courses[courseCode] = outcomeCode;
            }
            else if (line.length)
            {
                const [code, ...description] = line.split(' ');
                outcomes[code] = description.join(' ');
            }
        })

        return {outcomes, courses};
    }

    useEffect(() => {
        const getData = async () => {
            const result = await fetchData("curriculum.map.txt");
            if(result) {
                const info = extractInfo(result);
                setSLO(info.outcomes);
                setCourses(info.courses);
            }
        }
        getData();
    }, []);

    const handleSelectChange = (event) => {
        setSelectedClass(event.target.value);
    };

    const handleNextPage = () => {
        if(selectedClass) {
            const slo = courses[selectedClass];
            const desc = SLO[slo.split('-')[0]];
            updateData("selectedCourse", selectedClass);
            updateData("SLO", slo);
            updateData("description", desc);
            navigate(`/SLO`);
        } else {
            alert("Please select a class first.");
        }
    }

    return (
        <div className="class-container">
            <h1 className="item">Select a Class</h1>
            <div className="item">
                <select value={selectedClass} onChange={handleSelectChange} className="dropdown">
                    <option value="">-- Select Class --</option>
                    {Object.keys(courses).map((course, index) => (
                        <option key={index} value={course}>{course}</option>
                    ))}
                </select>
            </div>
            <div className="submit-button">
                <Button text={"Submit"} onClick={handleNextPage} className="next-button"/>
            </div>
        </div>

    );
}

export default Class;

