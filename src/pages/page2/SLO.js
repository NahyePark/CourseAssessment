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
        const lines = text.split("\n").map(line => line.trim()).filter(Boolean);

        let currentCourse = null;
        let result = [];
        
        for(const line of lines)
        {
            if(line.toLowerCase() === "course description")
                continue;

            if(/^[a-zA-Z]{2,5}\d{2,4}[a-zA-Z]*$/.test(line))
            {
                currentCourse = line.toLowerCase();
                continue;
            }

            if (currentCourse && currentCourse === data.selectedCourse.toLowerCase())
                result.push(line);
        }

        return result;
    }

    useEffect(() => {
        const getData = async () => {
            const result = await fetchData("PI_Old-db.txt");
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
            const initialCourseActivities = Object.keys(checkedItems).map((pi, index) => ({
                "ID": `PI${index + 1}`,
                "Performance Indicator": pi, 
            }));
            updateData("courseActivities", initialCourseActivities);
            navigate(`/PI`);
        } else {
            alert("Please select at least 1 outcome.");
        }
    }

    const handlePrevPage = () => {
        navigate(`/`);
    }


    return (
        <div className="class-container">
            <h1 className="item">Course <strong>{data.selectedCourse || "None"}</strong></h1>
            <p className="item">Student Learning Outcomes supported by this course: <br /><strong>{data.SLO} {data.level}</strong> {data.description}</p>
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
                <Button text={"Previous"} onClick={handlePrevPage} className="prev-button"/>
                <Button text={"Submit"} onClick={handleNextPage} className="next-button"/>
            </div>
        </div>
    );
}

export default SLO;

//<p>Selected: {Object.keys(checkedItems).filter((key) => checkedItems[key]).join(", ")}</p>