import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react";
import Button from "../../components/Button"
import { fetchData } from "../../services/api";
import { useData } from "../DataContext";
import "./SLO.css";
import "../Pages.css";

function SLO() {
    const navigate = useNavigate();

    const [checkedItems, setCheckedItems] = useState({});
    const [outcomes, setOutcomes] = useState([]);
    const {data, updateData} = useData();

    const extractInfo = (text) => {
        const courseSections = text.split("================================================================================");
        for(let section of courseSections) {
            const lines = section.trim().split("\n");
            if(lines[0].trim().toLowerCase() === data.selectedCourse.toLowerCase()) {
                return lines.slice(3).filter(line => !line.startsWith('=')&& line.trim() !== '').map(line => line.replace(/^\s*-\s*/, ''));
            }
        }

        return [];
    }

    useEffect(() => {
        const getData = async () => {
            const result = await fetchData("course.outcomes.txt");
            if(result) {
                const info = extractInfo(result);
                setOutcomes(info);
            }
        }
        getData();
    }, []);

    const handleCheckBoxChange = (event) => {
        const {name,checked} = event.target;
        setCheckedItems((prev) => ({
            ...prev,
            [name]: checked,
        }));
    };


    const handleNextPage = () => {
        const isAnyChecked = Object.values(checkedItems).includes(true);
        if(isAnyChecked) {
            //updateData("pis", Object.keys(checkedItems).filter((key) => checkedItems[key] === true));
            console.log(data.pis);
            const initialCourseActivities = Object.keys(checkedItems).map((pi, index) => ({
                "ID": `PI${index + 1}`,
                "Performance Indicator": pi, 
            }));
            updateData("piTable", initialCourseActivities);
            navigate(`/PI`);
        } else {
            alert("Please select at least 1 outcome.");
        }
    }


    return (
        <div className="class-container">
            <h1 className="item">Course <strong>{data.selectedCourse || "None"}</strong></h1>
            <p className="item">Student Learning Outcomes supported by this course: <strong>{data.SLO}</strong><br />{data.description}</p>
            <div className="check-box">
                <p><strong>Course Outcomes</strong></p>
                {outcomes.map((option) => (
                    <label key={option} className="option">
                        <input type="checkbox" className="p" name={option} checked={checkedItems[option] || false} onChange={handleCheckBoxChange}/>
                        {option}
                    </label>
                ))}
            </div>
            <div className="submit-button">
                <Button text={"Submit"} onClick={handleNextPage} className="next-button"/>
            </div>
        </div>
    );
}

export default SLO;

//<p>Selected: {Object.keys(checkedItems).filter((key) => checkedItems[key]).join(", ")}</p>