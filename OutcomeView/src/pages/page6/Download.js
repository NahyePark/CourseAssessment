import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef, useCallback } from "react";
import Button from "../../components/Button";
import "../Pages.css";
import { useData } from "../DataContext";
import generateLatex from "../GenerateLatex";
import axios from "axios";
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;


function Download() {
    const navigate = useNavigate();
    const {data} = useData();
    const [url, setUrl] = useState({pdf: "",
                                    latex: "",
                                    zip: ""});
    const [numPages, setNumPages] = useState(null);
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    const canvasRef = useRef(null); // Reference for the canvas element
    const [currentPage, setCurrentPage] = useState(1);


    ////////////// Save manually created rubric
    const saveRubricData = async (data) => {
        try {
            const extractedTable = data.rubricTable.filter(row => !row.isNumberRow);
            console.log(extractedTable);
            const payload = extractedTable.map(row => ({
                course: data.selectedCourse,
                semester: data.semester,
                slo: data.SLO,
                level: data.level,
                exercise: row["Course Activity"],
                pi: row.PI,
                description: row.Description,
                unsatisfactory: row.Unsatisfactory,
                developing: row.Developing,
                satisfactory: row.Satisfactory,
                exemplary: row.Exemplary
            }));
            console.log('payload:', payload);
            const response = await axios.post('/api/save-rubrics', payload);
            console.log('Saved successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error saving rubric data:', error);
        }
    };

    ///////// Save rubric data from CSV file
    const getPIText = useCallback((piId) => {
        return (data.courseActivities || []).find(p => String(p.ID) === String(piId))?.["Performance Indicator"]?? `PI ${piId}`;
    }, [data.courseActivities]);

    // weight (0-1)
    const getWeightsForPI = useCallback((piId, acts) => {
        const manual = data.formulaByPI?.[piId]?.weights || {};
        if (!acts?.length) return {};
        if (acts.length === 1) return { [acts[0]]: 1.0 };
        const sumOthers = acts.slice(0, -1).reduce((s, a) => s + (Number(manual[a]) || 0), 0);
        const last = Math.max(0, +(1 - sumOthers).toFixed(4));
        const w = {};
        acts.forEach((a, idx) => { w[a] = idx === acts.length - 1 ? last : (Number(manual[a]) || 0); });
        return w;
    }, [data.formulaByPI]);

    const safeSplitActs = (label) => String(label ?? "").split(",").map(s => s.trim()).filter(Boolean);

    // {course, semester, slo, level, pi, description, details}
    const buildPicsvRecords = useCallback(() => {
        const records = [];
        if (!Array.isArray(data.piTable) || data.piTable.length === 0) return records;

        const byPI = new Map();
        for (const r of data.piTable) {
            const id = String(r.ID);
            if (!byPI.has(id)) byPI.set(id, r);
        }

        for (const [piId, row] of byPI.entries()) {
            const piText = row["Performance Indicator"] ?? getPIText(piId);
            const acts   = safeSplitActs(row["Course Activities supporting the PI"]);

            const w = getWeightsForPI(piId, acts);
            // "50%Activity1 + 50%Activity2"
            const weightLine = acts
            .map(a => `${Math.round((w[a] || 0) * 100)}%${a}`)
            .join(" + ");

            // Description for the activities
            const descLines = acts
            .map(a => `${a} description: ${data.activityDescs?.[a] ?? ""}`)
            .join("\n                ");

            // Cutoffs
            const th = data.thresholdByPI?.[piId] || {};
            const cutoffs = [th.unsat, th.dev, th.sat, th.ex].map(v => (v ?? "")).join(",");

            records.push({
            course:      data.selectedCourse ?? "",
            semester:    data.semester ?? data.selectedSemester ?? "",
            slo:         data.SLO ?? "",
            level:       data.level ?? "",
            pi:          piText,
            description: data.piDescriptions?.[piId] ?? "",
            details:     `${weightLine}\n                ${descLines}\n                Cutoffs: ${cutoffs}`,
            });
        }

        return records;
    }, [data.piTable, data.selectedCourse, data.semester, data.selectedSemester, data.SLO, data.level, data.piDescriptions, data.activityDescs, data.thresholdByPI, getPIText, getWeightsForPI]);

    const savePicsvData = async (records) => {
        try {
            if (!Array.isArray(records) || records.length === 0) {
            return { success: false, error: "No PICSV records to save" };
            }
            const response = await axios.post('/api/save-picsv', records);
            return response.data;
        } catch (error) {
            console.error('Error saving PICSV data:', error);
            return { success: false, error: error.message };
        }
    };

    useEffect(() => {
        console.log("[useEffect] sending latex to server...");
        
        const sendLatexToServer = async () => {
            const latex = generateLatex(data);
            const semester = data.semester; 
            const course = data.selectedCourse;
            try {
                const response = await axios.post("http://localhost:5000/generate", { latex, semester, course });
                setUrl({
                    pdf: response.data.pdfUrl,
                    latex: response.data.latexUrl,
                    zip: response.data.zipUrl,
                })
            } catch (err) {
                console.error("PDF generation failed:", err);
            }
        };
    
        sendLatexToServer();
    }, [data]);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
      }, []);

    const onDocumentLoadSuccess = ({ numPages }) => {
        console.log('Document loaded successfully');
        console.log('Number of pages:', numPages);
        setNumPages(numPages);
      };

    useEffect(() => {
    const loadPDF = async () => {
        try {
            const loadingTask = pdfjs.getDocument(url.pdf);
            const pdf = await loadingTask.promise;
            onDocumentLoadSuccess({ numPages: pdf.numPages });

            const page = await pdf.getPage(currentPage);
            const viewport = page.getViewport({ scale: 1.5 });

            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;

            const renderContext = {
                canvasContext: context,
                viewport: viewport,
            };
            await page.render(renderContext);
        } catch (error) {
            console.error("Error loading PDF:", error);
        }
    };

    loadPDF();
    }, [url.pdf, currentPage]);

    const handleDownload = async (type) => {
        try{
            //download files
            const fileUrl = type === "pdf" ? url.pdf : type === "tex" ? url.latex : url.zip;
            console.log("File URL: ", fileUrl);
            const link = document.createElement("a");
            link.href = fileUrl;
            link.download = `2025 FALL Course Assessment.${type === "pdf" ? "pdf" : type === "tex" ? "tex" : "zip"}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            //save data to db according to the data(CSV or not)
            let result;
            if (data.flowSource === "PICSV") {
                const payload = buildPicsvRecords();
                result = await savePicsvData(payload);
            } else {
                result = await saveRubricData(data);
            }

            if (result.success) {
                console.log(`Saved.\nInserted: ${result.inserted}\nSkipped: ${result.skipped}`);
            } else {
                console.log(`Save failed.\nError: ${result.error}`);
            }

        } catch(error) {
            console.error('Save failed.: ', error);
        }
    };

    const goToNextPage = () => {
        if (currentPage < numPages) {
          setCurrentPage(currentPage + 1);
        }
      };
    
      const goToPreviousPage = () => {
        if (currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      };

      const handlePrevPage = () => {
        navigate(`/Summary`);
    }

    return (
        <div className="pdf-container">
            {url.pdf? (
                <>
                    <canvas ref={canvasRef}></canvas>
                    <div className="pdf-button-container">
                        <button className="pdf-button" onClick={goToPreviousPage} disabled={currentPage === 1}>
                            Previous
                        </button>
                        <span>Page {currentPage} of {numPages}</span>
                        <button className="pdf-button" onClick={goToNextPage} disabled={currentPage === numPages}>
                            Next
                        </button>
                    </div>
                </>
            ) : (
                <p>Loading PDF...</p>
            )}
            <div className="submit-button">
                <Button text={"Previous"} onClick={handlePrevPage} className="prev-button"/>
                <Button text={"Download PDF"} onClick={() => handleDownload("pdf")} className="next-button"/>
                <Button text={"Download Latex"} onClick={() => handleDownload("tex")} className="next-button"/>
                <Button text={"Download PDF and Latex"} onClick={() => handleDownload("zip")} className="next-button"/>
            </div>
        </div>
        
    );
};


export default Download;