import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Class from "./pages/page1/Class";
import SLO from "./pages/page2/SLO";
import PI from "./pages/page3/PI";
import Rubric from "./pages/page4/Rubric";
import Summary from "./pages/page5/Summary"
import Download from "./pages/page6/Download";

function AppRoutes() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Class />} />
                <Route path="/SLO" element={<SLO />} />
                <Route path="/PI" element={<PI />} />
                <Route path="/Rubric" element={<Rubric />} />
                <Route path="/Summary" element={<Summary />} />
                <Route path="/Download" element={<Download />} />
            </Routes>
        </Router>
    )
}

export default AppRoutes;