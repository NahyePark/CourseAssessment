function generateLatex(data) {

    const courseActivitiescolumns = [
        "Course Activities",
        "Program Indicator",
    ];

    const headerToKeyMap = {
        "Course Activities": "Course Activities supporting the PI",
        "Program Indicator": "Performance Indicator",
      };

    const CourseActivityTable = data.piTable.map(row => {
        const keys = Object.keys(row); 
        keys.pop(); 
        const { [keys[0]]: _, ...rest } = row; 
        return rest; 
      });

    

    const rubricColumns = [
        "Course Activity",
        "Exemplary",
        "Satisfactory",
        "Developing",
        "Unsatisfactory",
    ]

    const textRubricTable = data.rubricTable.filter(row => !row.isNumberRow);

    const cumulativeColumns = [
        "ID",
        "Exemplary",
        "Satisfactory",
        "Developing",
        "Unsatisfactory",
    ]

    const escapeLatex = (str) => {

        str = String(str || '');

        return str
          .replace(/\r/g, '')
          .replace(/\u00A0/g, ' ')
          .replace(/[&%$_#]/g, (match) => {
            switch (match) {
              case '&': return '\\&';
              case '%': return '\\%';
              case '$': return '\\$';
              case '_': return '\\_';
              case '#': return '\\#';
              default: return match;
            }
          });
      };

      const generateLatexTable = (tableData, columns, map) => {
        const columnWidth = (1 / columns.length).toFixed(3);
        const columnFormat = columns.map(() => `p{${columnWidth}\\textwidth}`).join('|');

        let latexTable = `\\begin{tabular}{|${columnFormat}|}`;
        latexTable += '\\hline\n';
    
        // Table header
        latexTable += columns.join(' & ') + ' \\\\ \\hline\n';
    
        // Table rows
        if(map)
        {
            tableData.forEach(row => {
                latexTable += columns.map((col) => escapeLatex(row[headerToKeyMap[col]] || '')).join(' & ') + ' \\\\ \\hline\n';
            });
        }
        else
        {
            tableData.forEach(row => {
                latexTable += columns.map((col) => escapeLatex(row[col] || '')).join(' & ') + ' \\\\ \\hline\n';
            });
        }

    
        latexTable += '\\end{tabular}';
        return latexTable;
    };

      const generateLatexHistogram = (rowData) => {

        const values = [
            parseFloat(rowData.Exemplary),
            parseFloat(rowData.Satisfactory),
            parseFloat(rowData.Developing),
            parseFloat(rowData.Unsatisfactory)
        ];
    
        return `
    \\begin{tikzpicture}
    \\begin{axis}[
        ybar,
        width=10cm,
        height=6cm,
        enlarge x limits=0.2, 
        xlabel={Level of Attainment},
        ylabel={Percentage},
        symbolic x coords={Exemplary, Satisfactory, Developing, Unsatisfactory},
        xtick={Exemplary, Satisfactory, Developing, Unsatisfactory}, 
        xtick distance=0.1, 
        ymajorgrids=true,
        grid style=dashed,
        nodes near coords, % Display numbers near bars
        every node near coord/.append style={font=\\small, text=black}, 
        bar width=12pt, 
    ]
    \\addplot coordinates {(Exemplary, ${values[0]}) (Satisfactory, ${values[1]}) (Developing, ${values[2]}) (Unsatisfactory, ${values[3]})};
    \\end{axis}
    \\end{tikzpicture}
    `;
    };


    const latexContent = `
\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage{pgfplots}
\\pgfplotsset{compat=1.18}
\\usepackage{parskip}  % This will help for paragraph spacing, if needed
\\begin{document}

\\section*{\\textbf{${data.selectedCourse} SPRING 2024 COURSE ASSESSMENT}}
Instructor \\\\
\\\\
\\textbf{Part I - Performance Indicators, student outcomes and levels of focus.} \\\\
\\\\
${data.SLO} : ${data.description} \\\\
\\\\
${generateLatexTable(CourseActivityTable, courseActivitiescolumns,true)} \\\\
\\\\
\\\\
\\textbf{Part II - Rubrics.} \\\\
\\\\
${generateLatexTable(textRubricTable, rubricColumns,false)} \\\\
\\\\
\\\\
\\textbf{Part III – Outcome Assessment.} \\\\
\\\\
${generateLatexTable(data.cumulativeTable, cumulativeColumns, false)} \\\\
\\\\
\\\\
${generateLatexHistogram(data.cumulativeTable[data.cumulativeTable.length - 1])} \\\\
\\\\
\\\\
\\textbf{Part IV – Analysis.} \\\\
\\\\
\\parbox{\\textwidth}{\\raggedright ${escapeLatex(data.dataAnalysis)}}
\\end{document}
`;

    return latexContent;
};

export default generateLatex;
