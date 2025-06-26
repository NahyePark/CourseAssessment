import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react";
import Button from "../../components/Button"
import { fetchSLOs, fetchPIs } from "../../services/api";
import { useData } from "../DataContext";
import "./SLO.css";
import "../Pages.css";

function SLO() {
    const navigate = useNavigate();

    const [checkedItems, setCheckedItems] = useState({});
    const [outcomes, setOutcomes] = useState([]);
    const {data, updateData} = useData();
    const [SLO, setSLO] = useState({});


    useEffect(() => {
        const getData = async () => {
            const params = new URLSearchParams(window.location.search);
            const course = params.get("course");
            const slo = params.get("slo");
            const level = params.get("level")
            
            const result = await fetchPIs();
            const sloResult = await fetchSLOs();
            if(result && result.length) {
                const selectedCourse = course.toLowerCase();
                const filtered = result.filter(item => item.course.toLowerCase() === selectedCourse)
                                    .map(item=> item.indicator);
                
                setOutcomes(filtered);                   
            }

            
            const sloMap = {};
            sloResult.forEach(item => {
                sloMap[item.code] = {
                    description: item.description,
                    semester: item.semester
                };
            });
            setSLO(sloMap);

            const desc = sloMap[slo]?.description || "";
            updateData({
                selectedCourse: course,
                SLO: slo,
                level: level,
                description: desc
            });
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
