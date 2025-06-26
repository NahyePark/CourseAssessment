import { useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
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
    
            const response = await axios.post('/api/save-rubrics', payload);
            console.log('Saved successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error saving rubric data:', error);
        }
    };

    useEffect(() => {
        const sendLatexToServer = async () => {
            const latex = generateLatex(data);
            try {
                const response = await axios.post("http://localhost:5000/generate", { latex });
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
            const link = document.createElement("a");
            link.href = fileUrl;
            link.download = `2025 FALL Course Assessment.${type === "pdf" ? "pdf" : type === "tex" ? "tex" : "zip"}`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            //save data to db
            const result = await saveRubricData(data);
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